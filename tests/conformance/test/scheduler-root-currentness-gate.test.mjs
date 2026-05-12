import assert from "node:assert/strict";
import test from "node:test";

import {
  SCHEDULER_ROOT_CURRENTNESS_GATE_STATUS,
  SCHEDULER_ROOT_CURRENTNESS_SCENARIO_IDS,
  SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS,
  evaluateSchedulerRootCurrentnessGate
} from "../src/scheduler-root-currentness-gate.mjs";
import { readCheckedSchedulerRootOracle } from "../src/scheduler-root-oracle.mjs";
import { SCHEDULER_ROOT_SCENARIO_IDS } from "../src/scheduler-root-scenarios.mjs";
import { SCHEDULER_ROOT_PROBE_MODES } from "../src/scheduler-root-targets.mjs";

const oracle = readCheckedSchedulerRootOracle();

const EXPECTED_EXPORT_KEYS = [
  "unstable_now",
  "unstable_IdlePriority",
  "unstable_ImmediatePriority",
  "unstable_LowPriority",
  "unstable_NormalPriority",
  "unstable_Profiling",
  "unstable_UserBlockingPriority",
  "unstable_cancelCallback",
  "unstable_forceFrameRate",
  "unstable_getCurrentPriorityLevel",
  "unstable_next",
  "unstable_requestPaint",
  "unstable_runWithPriority",
  "unstable_scheduleCallback",
  "unstable_shouldYield",
  "unstable_wrapCallback"
];

const EXPECTED_TIMEOUTS = new Map([
  ["immediate", "-1ms"],
  ["user-blocking", "250ms"],
  ["normal", "5000ms"],
  ["low", "10000ms"],
  ["idle", "1073741823ms"]
]);

let cachedBaselineGate = null;

test("Scheduler root currentness gate records current local root rows without public compatibility claims", () => {
  const gate = baselineGate();

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_GATE_STATUS);
  assert.equal(
    gate.oracleArtifactPath,
    "oracles/scheduler-0.27.0-root-oracle.json"
  );
  assert.deepEqual(
    gate.currentnessScenarioIds,
    SCHEDULER_ROOT_CURRENTNESS_SCENARIO_IDS
  );
  assert.deepEqual(
    SCHEDULER_ROOT_CURRENTNESS_SCENARIO_IDS,
    SCHEDULER_ROOT_SCENARIO_IDS
  );
  assert.equal(
    gate.currentnessRows.length,
    SCHEDULER_ROOT_CURRENTNESS_SCENARIO_IDS.length *
      SCHEDULER_ROOT_PROBE_MODES.length
  );
  assert.equal(gate.currentnessRowsMatched, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(
    Object.values(gate.blockedPublicClaims),
    Object.values(gate.blockedPublicClaims).map(() => false)
  );
  assert.deepEqual(Object.keys(gate.blockedPublicClaims), [
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

  assert.equal(
    gate.privateVariantBoundaryContext.role,
    "private-scheduler-variant-boundary-context-only"
  );
  assert.equal(
    gate.privateVariantBoundaryContext.acceptedAsPrivateContextOnly,
    true
  );
  assert.equal(gate.privateVariantBoundaryContext.behaviorEvidenceUsed, false);
  assert.equal(
    gate.privateVariantBoundaryContext.rootBehaviorEvidenceAllowed,
    false
  );

  assert.deepEqual(
    gate.sourceRows.map((row) => [
      row.rowId,
      row.status,
      row.behaviorEvidenceAllowed
    ]),
    [
      [
        "scheduler-root-wrapper-source",
        "current-source-row-present",
        true
      ],
      [
        "scheduler-root-development-cjs-source-context",
        "current-source-row-present",
        false
      ],
      [
        "scheduler-root-production-cjs-source-context",
        "current-source-row-present",
        false
      ]
    ]
  );

  for (const row of gate.currentnessRows) {
    assert.equal(
      row.status,
      "current-local-root-observation-matches-checked-oracle",
      row.rowId
    );
    assert.equal(row.entrypoint, "scheduler", row.rowId);
    assert.equal(row.currentResultStatus, "returned", row.rowId);
    assert.equal(row.checkedLocalResultStatus, "returned", row.rowId);
    assert.equal(row.checkedSchedulerResultStatus, "returned", row.rowId);
    assert.equal(
      row.currentVsCheckedLocalFirstDifferencePath,
      null,
      row.rowId
    );
    assert.equal(
      row.checkedLocalVsSchedulerFirstDifferencePath,
      null,
      row.rowId
    );
    assert.equal(row.checkedComparisonStatus, "matched-but-compatibility-not-claimed");
    assert.equal(row.compatibilityClaimed, false, row.rowId);
    assert.deepEqual(row.behaviorEvidence, {
      behaviorEvidenceKind: "current-local-root-probe",
      entrypoint: "scheduler",
      sourcePath: "packages/scheduler/index.js",
      directDeepCjsImport: false,
      variantBoundaryEvidence: false,
      privateAdmission886Evidence: false,
      compatibilityClaimed: false
    });
  }
});

test("Scheduler root currentness rows cover the full public-root observations", () => {
  const gate = baselineGate();

  for (const mode of SCHEDULER_ROOT_PROBE_MODES) {
    const exportShape = currentValue(
      gate,
      mode.id,
      "scheduler-root-export-shape"
    );
    assert.deepEqual(exportShape.exportKeys, EXPECTED_EXPORT_KEYS, mode.id);
    assert.deepEqual(
      exportShape.constants,
      {
        unstable_ImmediatePriority: 1,
        unstable_UserBlockingPriority: 2,
        unstable_NormalPriority: 3,
        unstable_LowPriority: 4,
        unstable_IdlePriority: 5,
        unstable_Profiling: null
      },
      mode.id
    );

    const taskShape = currentValue(
      gate,
      mode.id,
      "scheduler-root-task-object-shape"
    );
    for (const task of taskShape.readyTasks) {
      assert.deepEqual(task.beforeCancel.objectKeys, [
        "id",
        "callback",
        "priorityLevel",
        "startTime",
        "expirationTime",
        "sortIndex"
      ]);
      assert.equal(task.beforeCancel.callback.type, "function", mode.id);
      assert.equal(task.afterCancel.callback.type, "null", mode.id);
      assert.equal(task.beforeCancel.sortIndexRole, "expirationTime", mode.id);
      assert.equal(
        task.beforeCancel.expirationDelta,
        EXPECTED_TIMEOUTS.get(task.label),
        mode.id
      );
    }
    assert.equal(
      taskShape.delayedTask.beforeCancel.startTime,
      "delayed-future-start",
      mode.id
    );
    assert.equal(
      taskShape.delayedTask.beforeCancel.sortIndexRole,
      "startTime",
      mode.id
    );
    assert.equal(
      taskShape.delayedTask.beforeCancel.expirationDelta,
      "5000ms",
      mode.id
    );
    assert.equal(taskShape.delayedTask.afterCancel.callback.type, "null");

    assert.deepEqual(
      currentValue(gate, mode.id, "scheduler-root-priority-ordering").runOrder,
      ["immediate", "user-blocking", "normal", "low", "idle"],
      mode.id
    );
    assert.deepEqual(
      currentValue(gate, mode.id, "scheduler-root-equal-priority-fifo")
        .runOrder,
      ["first", "second", "third", "fourth"],
      mode.id
    );
    assert.deepEqual(
      currentValue(gate, mode.id, "scheduler-root-delayed-callbacks").runOrder,
      ["ready-normal", "delayed-normal"],
      mode.id
    );

    const cancellation = currentValue(
      gate,
      mode.id,
      "scheduler-root-cancellation"
    );
    assert.deepEqual(cancellation.runOrder, ["first", "third"], mode.id);
    assert.equal(cancellation.afterCancelCallback.type, "null", mode.id);

    assert.deepEqual(
      currentValue(gate, mode.id, "scheduler-root-continuations").runOrder,
      ["first-callback", "first-continuation", "second-callback"],
      mode.id
    );

    const didTimeout = currentValue(
      gate,
      mode.id,
      "scheduler-root-did-timeout"
    );
    assert.deepEqual(
      didTimeout.runOrder,
      ["immediate", "user-blocking-expired", "normal-after-block"],
      mode.id
    );
    assert.deepEqual(didTimeout.didTimeoutByLabel, {
      immediate: true,
      "user-blocking-expired": true,
      "normal-after-block": false
    });
    assert.equal(
      didTimeout.blockDurationCategory,
      ">=400ms-and-<normal-timeout",
      mode.id
    );

    const priorityContext = currentValue(
      gate,
      mode.id,
      "scheduler-root-priority-context"
    );
    assert.equal(priorityContext.defaultCurrentPriorityLevel, 3, mode.id);
    assert.deepEqual(
      priorityContext.runWithPriority.map((entry) => [
        entry.label,
        entry.returnValue.currentPriorityLevel,
        entry.afterReturnPriorityLevel
      ]),
      [
        ["immediate", 1, 3],
        ["user-blocking", 2, 3],
        ["normal", 3, 3],
        ["low", 4, 3],
        ["idle", 5, 3]
      ],
      mode.id
    );
    assert.deepEqual(
      priorityContext.nextByParent.map((entry) => [
        entry.parent,
        entry.currentPriorityLevel,
        entry.afterReturnPriorityLevel
      ]),
      [
        ["immediate", 3, 3],
        ["user-blocking", 3, 3],
        ["normal", 3, 3],
        ["low", 4, 3],
        ["idle", 5, 3]
      ],
      mode.id
    );
    assert.equal(
      priorityContext.restorationAfterThrow.value.currentPriorityLevel,
      3,
      mode.id
    );
    assert.deepEqual(priorityContext.wrapCallback.callResult, {
      thisLabel: "receiver",
      args: ["alpha", "beta"],
      currentPriorityLevel: 2
    });
    assert.equal(priorityContext.wrapCallback.beforeCallPriorityLevel, 4);
    assert.equal(priorityContext.wrapCallback.afterCallPriorityLevel, 4);

    const yieldPaint = currentValue(
      gate,
      mode.id,
      "scheduler-root-yield-paint-frame-rate"
    );
    assert.deepEqual(yieldPaint.runOrder, ["first", "second"], mode.id);
    assert.equal(
      yieldPaint.events[0].shouldYieldAfterRequestPaint,
      true,
      mode.id
    );
    assert.equal(
      yieldPaint.events[1].shouldYieldAtSecondCallbackStart,
      false,
      mode.id
    );

    const hostTransport = currentValue(
      gate,
      mode.id,
      "scheduler-root-node-host-transport"
    );
    assert.equal(hostTransport.firstTransport, "setImmediate", mode.id);
    assert.deepEqual(hostTransport.runOrder, ["normal-callback"], mode.id);
  }
});

test("Scheduler root currentness gate fails closed for a stale oracle schema", () => {
  const staleOracle = cloneJson(oracle);
  staleOracle.schemaVersion = 0;

  const gate = evaluateWithBaselineRows({
    oracle: staleOracle
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assertViolation(gate, "scheduler-root-currentness-stale-oracle-schema");
});

test("Scheduler root currentness gate fails closed when the checked oracle adds an uncovered scenario", () => {
  const expandedOracle = cloneJson(oracle);
  expandedOracle.scenarios.push({
    id: "scheduler-root-new-oracle-scenario",
    area: "New Scheduler root behavior",
    entrypoints: ["scheduler"],
    captures: ["new behavior must be added to the currentness gate"]
  });

  const gate = evaluateWithBaselineRows({
    oracle: expandedOracle
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-scenario-manifest-mismatch"
    ),
    {
      id: "scheduler-root-currentness-scenario-manifest-mismatch",
      missingScenarioIds: ["scheduler-root-new-oracle-scenario"],
      unexpectedScenarioIds: []
    }
  );
});

test("Scheduler root currentness gate fails closed for missing current local rows", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows)
    .filter(
      (row) =>
        row.rowId !== "default-node-development:scheduler-root-cancellation"
    );

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-missing-local-observation-row"
    ).rowIds,
    ["default-node-development:scheduler-root-cancellation"]
  );
});

test("Scheduler root currentness gate fails closed for unexpected current local rows", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows);
  localObservationRows.push({
    ...localObservationRows[0],
    rowId: "default-node-development:scheduler-root-unexpected",
    scenarioId: "scheduler-root-unexpected"
  });

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-local-observation-manifest-mismatch"
    ),
    {
      id: "scheduler-root-currentness-local-observation-manifest-mismatch",
      missingRowIds: [],
      unexpectedRowIds: [
        "default-node-development:scheduler-root-unexpected"
      ],
      duplicateRowIds: []
    }
  );
});

test("Scheduler root currentness gate fails closed when a local rowId is forged", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows);
  rowById(
    localObservationRows,
    "default-node-development:scheduler-root-export-shape"
  ).rowId = "unexpected-local-row-id";

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-local-observation-manifest-mismatch"
    ),
    {
      id: "scheduler-root-currentness-local-observation-manifest-mismatch",
      missingRowIds: ["default-node-development:scheduler-root-export-shape"],
      unexpectedRowIds: ["unexpected-local-row-id"],
      duplicateRowIds: []
    }
  );
});

test("Scheduler root currentness gate fails closed for missing current local rows for the former coverage gaps", () => {
  const missingScenarioIds = [
    "scheduler-root-task-object-shape",
    "scheduler-root-did-timeout",
    "scheduler-root-priority-context"
  ];
  const localObservationRows = cloneJson(
    baselineGate().localObservationRows
  ).filter(
    (row) =>
      row.modeId !== "default-node-development" ||
      !missingScenarioIds.includes(row.scenarioId)
  );

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-missing-local-observation-row"
    ).rowIds,
    [
      "default-node-development:scheduler-root-task-object-shape",
      "default-node-development:scheduler-root-did-timeout",
      "default-node-development:scheduler-root-priority-context"
    ]
  );
});

test("Scheduler root currentness gate fails closed when source rows are omitted", () => {
  const gate = evaluateWithBaselineRows({
    sourceRows: []
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.equal(gate.sourceRowsCurrent, false);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-source-row-manifest-mismatch"
    ),
    {
      id: "scheduler-root-currentness-source-row-manifest-mismatch",
      missingRowIds: [
        "scheduler-root-wrapper-source",
        "scheduler-root-development-cjs-source-context",
        "scheduler-root-production-cjs-source-context"
      ],
      unexpectedRowIds: [],
      duplicateRowIds: []
    }
  );
});

test("Scheduler root currentness gate fails closed for unexpected or forged source rows", () => {
  const sourceRows = cloneJson(baselineGate().sourceRows);
  sourceRows.push({
    ...sourceRows[0],
    rowId: "scheduler-root-unexpected-source",
    sourcePath: "packages/scheduler/native.js"
  });
  rowById(
    sourceRows,
    "scheduler-root-development-cjs-source-context"
  ).sourcePath = "packages/scheduler/native.js";
  rowById(
    sourceRows,
    "scheduler-root-production-cjs-source-context"
  ).status = "current-source-row-stale";

  const gate = evaluateWithBaselineRows({
    sourceRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.equal(gate.sourceRowsCurrent, false);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-source-row-manifest-mismatch"
    ).unexpectedRowIds,
    ["scheduler-root-unexpected-source"]
  );
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-source-row-identity-mismatch"
    ).rowIds,
    [
      "scheduler-root-development-cjs-source-context",
      "scheduler-root-production-cjs-source-context"
    ]
  );
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-source-row-missing-or-stale"
    ).rowIds,
    ["scheduler-root-production-cjs-source-context"]
  );
});

test("Scheduler root currentness gate fails closed for extra source row fields", () => {
  const sourceRows = cloneJson(baselineGate().sourceRows);
  rowById(
    sourceRows,
    "scheduler-root-wrapper-source"
  ).publicPackageCompatibilityClaimed = true;
  rowById(
    sourceRows,
    "scheduler-root-development-cjs-source-context"
  ).forgedIdentity = "scheduler-root-wrapper-source";

  const gate = evaluateWithBaselineRows({
    sourceRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.equal(gate.sourceRowsCurrent, false);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-source-row-identity-mismatch"
    ).rowIds,
    [
      "scheduler-root-wrapper-source",
      "scheduler-root-development-cjs-source-context"
    ]
  );
});

test("Scheduler root currentness gate fails closed for hidden or accessor source row fields", () => {
  const sourceRows = cloneJson(baselineGate().sourceRows);
  Object.setPrototypeOf(rowById(sourceRows, "scheduler-root-wrapper-source"), {
    public_package_compatibility_claimed: true
  });
  Object.defineProperty(
    rowById(sourceRows, "scheduler-root-development-cjs-source-context"),
    "public_package_compatibility_claimed",
    {
      value: true,
      enumerable: false
    }
  );
  Object.defineProperty(
    rowById(sourceRows, "scheduler-root-production-cjs-source-context"),
    "sourcePath",
    {
      get() {
        return "packages/scheduler/cjs/scheduler.production.js";
      },
      enumerable: true
    }
  );

  const gate = evaluateWithBaselineRows({
    sourceRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.equal(gate.sourceRowsCurrent, false);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-source-row-identity-mismatch"
    ).rowIds,
    [
      "scheduler-root-wrapper-source",
      "scheduler-root-development-cjs-source-context",
      "scheduler-root-production-cjs-source-context"
    ]
  );
});

test("Scheduler root currentness gate fails closed for symbol source row fields", () => {
  const sourceRows = cloneJson(baselineGate().sourceRows);
  rowById(sourceRows, "scheduler-root-wrapper-source")[
    Symbol("public_package_compatibility_claimed")
  ] = true;

  const gate = evaluateWithBaselineRows({
    sourceRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.equal(gate.sourceRowsCurrent, false);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-source-row-identity-mismatch"
    ).rowIds,
    ["scheduler-root-wrapper-source"]
  );
});

test("Scheduler root currentness gate fails closed for Object.prototype source row claim aliases", () => {
  withTemporaryObjectPrototypeProperties(
    {
      public_package_compatibility_claimed: true
    },
    () => {
      const gate = evaluateWithBaselineRows({
        sourceRows: cloneJson(baselineGate().sourceRows)
      });

      assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
      assert.equal(gate.sourceRowsCurrent, false);
      assert.deepEqual(
        violationById(
          gate,
          "scheduler-root-currentness-source-row-identity-mismatch"
        ).rowIds,
        [
          "scheduler-root-wrapper-source",
          "scheduler-root-development-cjs-source-context",
          "scheduler-root-production-cjs-source-context"
        ]
      );
    }
  );
});

test("Scheduler root currentness gate fails closed for production/development mode mismatch", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows);
  localObservationRows.find(
    (row) =>
      row.rowId === "default-node-production:scheduler-root-priority-ordering"
  ).nodeEnv = "development";

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-mode-node-env-mismatch"
    ).rowIds,
    ["default-node-production:scheduler-root-priority-ordering"]
  );
});

test("Scheduler root currentness gate rejects smuggled local row source identity", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows);
  const exportShapeRow = rowById(
    localObservationRows,
    "default-node-development:scheduler-root-export-shape"
  );
  exportShapeRow.entrypoint = "scheduler/native";
  exportShapeRow.packageName = "scheduler/unstable_mock";
  exportShapeRow.packageSourcePath =
    "packages/scheduler/src/forks/SchedulerPostTask.js";

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-local-observation-row-identity-mismatch"
    ).rowIds,
    ["default-node-development:scheduler-root-export-shape"]
  );
  assert.equal(
    rowById(
      gate.currentnessRows,
      "default-node-development:scheduler-root-export-shape"
    ).status,
    "local-observation-row-identity-mismatch"
  );
});

test("Scheduler root currentness gate rejects hidden, inherited, symbol, accessor, or missing local row identity fields", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows);
  Object.setPrototypeOf(
    rowById(
      localObservationRows,
      "default-node-development:scheduler-root-export-shape"
    ),
    {
      actualEntrypoint: "scheduler/native"
    }
  );
  Object.defineProperty(
    rowById(
      localObservationRows,
      "default-node-development:scheduler-root-task-object-shape"
    ),
    "actualSourcePath",
    {
      value: "packages/scheduler/src/forks/SchedulerPostTask.js",
      enumerable: false
    }
  );
  rowById(
    localObservationRows,
    "default-node-development:scheduler-root-did-timeout"
  )[Symbol("actualSourcePath")] =
    "packages/scheduler/src/forks/SchedulerPostTask.js";
  Object.defineProperty(
    rowById(
      localObservationRows,
      "default-node-development:scheduler-root-priority-context"
    ),
    "packageSourcePath",
    {
      get() {
        return "packages/scheduler";
      },
      enumerable: true
    }
  );
  delete rowById(
    localObservationRows,
    "default-node-development:scheduler-root-cancellation"
  ).packageSourcePath;

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-local-observation-row-identity-mismatch"
    ).rowIds,
    [
      "default-node-development:scheduler-root-export-shape",
      "default-node-development:scheduler-root-task-object-shape",
      "default-node-development:scheduler-root-cancellation",
      "default-node-development:scheduler-root-did-timeout",
      "default-node-development:scheduler-root-priority-context"
    ]
  );
});

test("Scheduler root currentness gate fails closed for stale task-shape, didTimeout, or priority-context rows", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows);
  rowById(
    localObservationRows,
    "default-node-development:scheduler-root-task-object-shape"
  ).observation.result.value.readyTasks.find(
    (task) => task.label === "normal"
  ).beforeCancel.expirationDelta = "4999ms";
  rowById(
    localObservationRows,
    "default-node-development:scheduler-root-did-timeout"
  ).observation.result.value.didTimeoutByLabel["normal-after-block"] = true;
  rowById(
    localObservationRows,
    "default-node-development:scheduler-root-priority-context"
  ).observation.result.value.runWithPriority[0].afterReturnPriorityLevel = 1;

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-local-observation-mismatch"
    ).rowIds,
    [
      "default-node-development:scheduler-root-task-object-shape",
      "default-node-development:scheduler-root-did-timeout",
      "default-node-development:scheduler-root-priority-context"
    ]
  );
});

test("Scheduler root currentness gate fails closed when compatibility flags flip true", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows);
  localObservationRows.find(
    (row) => row.rowId === "default-node-development:scheduler-root-export-shape"
  ).compatibilityClaimed = true;

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assertViolation(
    gate,
    "scheduler-root-currentness-row-compatibility-claim-detected"
  );
  assertViolation(
    gate,
    "scheduler-root-currentness-public-compatibility-claim-detected"
  );
});

test("Scheduler root currentness gate rejects claim-like fields on local rows and behavior evidence", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows);
  rowById(
    localObservationRows,
    "default-node-development:scheduler-root-export-shape"
  ).publicNativeCompatibilityClaimed = true;
  const taskShapeRow = rowById(
    localObservationRows,
    "default-node-development:scheduler-root-task-object-shape"
  );
  taskShapeRow.behaviorEvidence = {
    ...taskShapeRow.behaviorEvidence,
    publicPackageCompatibilityClaimed: true
  };

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-row-compatibility-claim-detected"
    ).rowIds,
    [
      "default-node-development:scheduler-root-export-shape",
      "default-node-development:scheduler-root-task-object-shape"
    ]
  );
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-public-compatibility-claim-detected"
    ).rowIds,
    [
      "default-node-development:scheduler-root-export-shape.publicNativeCompatibilityClaimed",
      "default-node-development:scheduler-root-task-object-shape.behaviorEvidence.publicPackageCompatibilityClaimed"
    ]
  );
});

test("Scheduler root currentness gate rejects snake_case compatibility aliases on local rows and behavior evidence", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows);
  rowById(
    localObservationRows,
    "default-node-development:scheduler-root-export-shape"
  ).public_native_compatibility_claimed = true;
  const taskShapeRow = rowById(
    localObservationRows,
    "default-node-development:scheduler-root-task-object-shape"
  );
  taskShapeRow.behaviorEvidence = {
    ...taskShapeRow.behaviorEvidence,
    public_package_compatibility_claimed: true
  };

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-row-compatibility-claim-detected"
    ).rowIds,
    [
      "default-node-development:scheduler-root-export-shape",
      "default-node-development:scheduler-root-task-object-shape"
    ]
  );
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-public-compatibility-claim-detected"
    ).rowIds,
    [
      "default-node-development:scheduler-root-export-shape.public_native_compatibility_claimed",
      "default-node-development:scheduler-root-task-object-shape.behaviorEvidence.public_package_compatibility_claimed"
    ]
  );
});

test("Scheduler root currentness gate rejects dash-separated compatibility aliases on local rows and behavior evidence", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows);
  rowById(
    localObservationRows,
    "default-node-development:scheduler-root-export-shape"
  )["public-native-compatibility-claimed"] = true;
  const taskShapeRow = rowById(
    localObservationRows,
    "default-node-development:scheduler-root-task-object-shape"
  );
  taskShapeRow.behaviorEvidence = {
    ...taskShapeRow.behaviorEvidence,
    "public-package-compatibility-claimed": true
  };

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-row-compatibility-claim-detected"
    ).rowIds,
    [
      "default-node-development:scheduler-root-export-shape",
      "default-node-development:scheduler-root-task-object-shape"
    ]
  );
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-public-compatibility-claim-detected"
    ).rowIds,
    [
      "default-node-development:scheduler-root-export-shape.public-native-compatibility-claimed",
      "default-node-development:scheduler-root-task-object-shape.behaviorEvidence.public-package-compatibility-claimed"
    ]
  );
});

test("Scheduler root currentness gate rejects inherited snake_case compatibility aliases on local rows and behavior evidence", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows);
  Object.setPrototypeOf(
    rowById(
      localObservationRows,
      "default-node-development:scheduler-root-export-shape"
    ),
    {
      public_native_compatibility_claimed: true
    }
  );
  const taskShapeRow = rowById(
    localObservationRows,
    "default-node-development:scheduler-root-task-object-shape"
  );
  taskShapeRow.behaviorEvidence = {
    ...taskShapeRow.behaviorEvidence
  };
  Object.setPrototypeOf(taskShapeRow.behaviorEvidence, {
    public_package_compatibility_claimed: true
  });

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-row-compatibility-claim-detected"
    ).rowIds,
    [
      "default-node-development:scheduler-root-export-shape",
      "default-node-development:scheduler-root-task-object-shape"
    ]
  );
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-public-compatibility-claim-detected"
    ).rowIds,
    [
      "default-node-development:scheduler-root-export-shape.public_native_compatibility_claimed",
      "default-node-development:scheduler-root-task-object-shape.behaviorEvidence.public_package_compatibility_claimed"
    ]
  );
});

test("Scheduler root currentness gate rejects non-enumerable snake_case compatibility aliases on local rows and behavior evidence", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows);
  Object.defineProperty(
    rowById(
      localObservationRows,
      "default-node-development:scheduler-root-export-shape"
    ),
    "public_native_compatibility_claimed",
    {
      value: true,
      enumerable: false
    }
  );
  const taskShapeRow = rowById(
    localObservationRows,
    "default-node-development:scheduler-root-task-object-shape"
  );
  taskShapeRow.behaviorEvidence = {
    ...taskShapeRow.behaviorEvidence
  };
  Object.defineProperty(
    taskShapeRow.behaviorEvidence,
    "public_package_compatibility_claimed",
    {
      value: true,
      enumerable: false
    }
  );

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-row-compatibility-claim-detected"
    ).rowIds,
    [
      "default-node-development:scheduler-root-export-shape",
      "default-node-development:scheduler-root-task-object-shape"
    ]
  );
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-public-compatibility-claim-detected"
    ).rowIds,
    [
      "default-node-development:scheduler-root-export-shape.public_native_compatibility_claimed",
      "default-node-development:scheduler-root-task-object-shape.behaviorEvidence.public_package_compatibility_claimed"
    ]
  );
});

test("Scheduler root currentness gate rejects Object.prototype snake_case compatibility aliases on local rows and behavior evidence", () => {
  withTemporaryObjectPrototypeProperties(
    {
      public_native_compatibility_claimed: true,
      public_package_compatibility_claimed: true
    },
    () => {
      const gate = evaluateWithBaselineRows({
        localObservationRows: cloneJson(baselineGate().localObservationRows)
      });
      const publicClaimRows = violationById(
        gate,
        "scheduler-root-currentness-public-compatibility-claim-detected"
      ).rowIds;

      assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
      assert.ok(
        publicClaimRows.includes(
          "default-node-development:scheduler-root-export-shape.public_native_compatibility_claimed"
        )
      );
      assert.ok(
        publicClaimRows.includes(
          "default-node-development:scheduler-root-export-shape.behaviorEvidence.public_package_compatibility_claimed"
        )
      );
      assert.ok(
        violationById(
          gate,
          "scheduler-root-currentness-row-compatibility-claim-detected"
        ).rowIds.includes("default-node-development:scheduler-root-export-shape")
      );
    }
  );
});

test("Scheduler root currentness gate rejects non-claim behavior evidence variant fields", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows);
  rowById(
    localObservationRows,
    "default-node-development:scheduler-root-export-shape"
  ).behaviorEvidence = {
    ...rowById(
      localObservationRows,
      "default-node-development:scheduler-root-export-shape"
    ).behaviorEvidence,
    actualEntrypoint: "scheduler/unstable_post_task",
    actualSourcePath: "packages/scheduler/src/forks/SchedulerPostTask.js"
  };

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-variant-or-deep-cjs-evidence-used"
    ).rowIds,
    ["default-node-development:scheduler-root-export-shape"]
  );
  assert.equal(
    rowById(
      gate.currentnessRows,
      "default-node-development:scheduler-root-export-shape"
    ).status,
    "non-root-or-private-variant-evidence-used"
  );
});

test("Scheduler root currentness gate rejects hidden, inherited, symbol, or accessor behavior evidence fields", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows);
  const exportShapeRow = rowById(
    localObservationRows,
    "default-node-development:scheduler-root-export-shape"
  );
  exportShapeRow.behaviorEvidence = {
    ...exportShapeRow.behaviorEvidence
  };
  Object.setPrototypeOf(exportShapeRow.behaviorEvidence, {
    actualEntrypoint: "scheduler/native"
  });

  const taskShapeRow = rowById(
    localObservationRows,
    "default-node-development:scheduler-root-task-object-shape"
  );
  taskShapeRow.behaviorEvidence = {
    ...taskShapeRow.behaviorEvidence
  };
  Object.defineProperty(taskShapeRow.behaviorEvidence, "actualSourcePath", {
    value: "packages/scheduler/src/forks/SchedulerPostTask.js",
    enumerable: false
  });

  const didTimeoutRow = rowById(
    localObservationRows,
    "default-node-development:scheduler-root-did-timeout"
  );
  didTimeoutRow.behaviorEvidence = {
    ...didTimeoutRow.behaviorEvidence
  };
  didTimeoutRow.behaviorEvidence[Symbol("actualSourcePath")] =
    "packages/scheduler/src/forks/SchedulerPostTask.js";

  const priorityContextRow = rowById(
    localObservationRows,
    "default-node-development:scheduler-root-priority-context"
  );
  priorityContextRow.behaviorEvidence = {
    ...priorityContextRow.behaviorEvidence
  };
  Object.defineProperty(priorityContextRow.behaviorEvidence, "sourcePath", {
    get() {
      return "packages/scheduler/index.js";
    },
    enumerable: true
  });

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-variant-or-deep-cjs-evidence-used"
    ).rowIds,
    [
      "default-node-development:scheduler-root-export-shape",
      "default-node-development:scheduler-root-task-object-shape",
      "default-node-development:scheduler-root-did-timeout",
      "default-node-development:scheduler-root-priority-context"
    ]
  );
});

test("Scheduler root currentness gate rejects variant, deep-CJS, native, mock, or postTask evidence as root behavior evidence", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows);
  rowById(
    localObservationRows,
    "default-node-development:scheduler-root-export-shape"
  ).behaviorEvidence = {
    behaviorEvidenceKind: "private-admission-886-variant-boundary",
    entrypoint: "scheduler/cjs/scheduler.development.js",
    sourcePath: "packages/scheduler/cjs/scheduler.development.js",
    directDeepCjsImport: true,
    variantBoundaryEvidence: true,
    privateAdmission886Evidence: true,
    compatibilityClaimed: false
  };
  rowById(
    localObservationRows,
    "default-node-development:scheduler-root-task-object-shape"
  ).behaviorEvidence = {
    behaviorEvidenceKind: "current-local-root-probe",
    entrypoint: "scheduler/native",
    sourcePath: "packages/scheduler/native.js",
    directDeepCjsImport: false,
    variantBoundaryEvidence: false,
    privateAdmission886Evidence: false,
    compatibilityClaimed: false
  };
  rowById(
    localObservationRows,
    "default-node-development:scheduler-root-did-timeout"
  ).behaviorEvidence = {
    behaviorEvidenceKind: "current-local-root-probe",
    entrypoint: "scheduler/unstable_post_task",
    sourcePath: "packages/scheduler/src/forks/SchedulerPostTask.js",
    directDeepCjsImport: false,
    variantBoundaryEvidence: false,
    privateAdmission886Evidence: false,
    compatibilityClaimed: false
  };
  rowById(
    localObservationRows,
    "default-node-development:scheduler-root-priority-context"
  ).behaviorEvidence = {
    behaviorEvidenceKind: "current-local-root-probe",
    entrypoint: "scheduler/unstable_mock",
    sourcePath: "packages/scheduler/unstable_mock.js",
    directDeepCjsImport: false,
    variantBoundaryEvidence: false,
    privateAdmission886Evidence: false,
    compatibilityClaimed: false
  };

  const gate = evaluateWithBaselineRows({
    localObservationRows
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-variant-or-deep-cjs-evidence-used"
    ).rowIds,
    [
      "default-node-development:scheduler-root-export-shape",
      "default-node-development:scheduler-root-task-object-shape",
      "default-node-development:scheduler-root-did-timeout",
      "default-node-development:scheduler-root-priority-context"
    ]
  );
});

test("Scheduler root currentness gate rejects public Scheduler/root/act/native/package compatibility claims", () => {
  const claimedOracle = cloneJson(oracle);
  claimedOracle.conformanceClaims.fastReactBehaviorCompatible = true;
  claimedOracle.conformanceClaims.compatibilityClaimed = true;
  claimedOracle.evidenceClaims.fastReactBehaviorCompatible = true;
  claimedOracle.packages.fastReactScheduler.behaviorCompatibilityClaimed = true;
  claimedOracle.implementationComparison.afterWorker164.compatibilityClaimed =
    true;
  claimedOracle.fastReactComparisons["default-node-development"][0]
    .compatibilityClaimed = true;

  const gate = evaluateWithBaselineRows({
    oracle: claimedOracle
  });

  assert.equal(gate.status, SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-row-compatibility-claim-detected"
    ).rowIds,
    ["default-node-development:scheduler-root-export-shape"]
  );
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-root-currentness-public-compatibility-claim-detected"
    ).rowIds,
    [
      "oracle.conformanceClaims.fastReactBehaviorCompatible",
      "oracle.conformanceClaims.compatibilityClaimed",
      "oracle.evidenceClaims.fastReactBehaviorCompatible",
      "oracle.packages.fastReactScheduler.behaviorCompatibilityClaimed",
      "oracle.implementationComparison.afterWorker164.compatibilityClaimed"
    ]
  );
});

function baselineGate() {
  cachedBaselineGate ??= evaluateSchedulerRootCurrentnessGate({
    oracle
  });
  return cachedBaselineGate;
}

function evaluateWithBaselineRows({
  localObservationRows = cloneJson(baselineGate().localObservationRows),
  sourceRows = cloneJson(baselineGate().sourceRows),
  oracle: effectiveOracle = oracle
} = {}) {
  return evaluateSchedulerRootCurrentnessGate({
    oracle: effectiveOracle,
    localObservationRows,
    sourceRows
  });
}

function currentValue(gate, modeId, scenarioId) {
  const row = gate.currentnessRows.find(
    (candidate) =>
      candidate.modeId === modeId && candidate.scenarioId === scenarioId
  );
  assert.ok(row, `missing currentness row ${modeId}:${scenarioId}`);
  assert.equal(row.observation.result.status, "returned");
  return row.observation.result.value;
}

function rowById(rows, rowId) {
  const row = rows.find((candidate) => candidate.rowId === rowId);
  assert.ok(row, `missing row ${rowId}`);
  return row;
}

function withTemporaryObjectPrototypeProperties(properties, callback) {
  const originalDescriptors = new Map();

  for (const key of Object.keys(properties)) {
    originalDescriptors.set(
      key,
      Object.getOwnPropertyDescriptor(Object.prototype, key)
    );
    Object.defineProperty(Object.prototype, key, {
      value: properties[key],
      enumerable: true,
      configurable: true,
      writable: true
    });
  }

  try {
    callback();
  } finally {
    for (const [key, descriptor] of originalDescriptors) {
      if (descriptor) {
        Object.defineProperty(Object.prototype, key, descriptor);
      } else {
        delete Object.prototype[key];
      }
    }
  }
}

function assertViolation(gate, id) {
  assert.ok(
    gate.violations.some((violation) => violation.id === id),
    `missing violation ${id}`
  );
}

function violationById(gate, id) {
  const violation = gate.violations.find((candidate) => candidate.id === id);
  assert.ok(violation, `missing violation ${id}`);
  return violation;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
