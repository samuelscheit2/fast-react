import assert from "node:assert/strict";
import test from "node:test";

import {
  SCHEDULER_ROOT_CURRENTNESS_GATE_STATUS,
  SCHEDULER_ROOT_CURRENTNESS_SCENARIO_IDS,
  SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS,
  evaluateSchedulerRootCurrentnessGate
} from "../src/scheduler-root-currentness-gate.mjs";
import { readCheckedSchedulerRootOracle } from "../src/scheduler-root-oracle.mjs";
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

test("Scheduler root currentness rows cover the safe public-root observations", () => {
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

test("Scheduler root currentness gate rejects variant or deep-CJS evidence as root behavior evidence", () => {
  const localObservationRows = cloneJson(baselineGate().localObservationRows);
  localObservationRows.find(
    (row) => row.rowId === "default-node-development:scheduler-root-export-shape"
  ).behaviorEvidence = {
    behaviorEvidenceKind: "private-admission-886-variant-boundary",
    entrypoint: "scheduler/cjs/scheduler.development.js",
    sourcePath: "packages/scheduler/cjs/scheduler.development.js",
    directDeepCjsImport: true,
    variantBoundaryEvidence: true,
    privateAdmission886Evidence: true,
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
    ["default-node-development:scheduler-root-export-shape"]
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
