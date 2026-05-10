import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertBenchmarkGate,
  validateBenchmarkManifest,
  validateBenchmarkResult
} from "../src/benchmark-gate.mjs";

const benchmarkRoot = path.resolve(
  fileURLToPath(new URL("..", import.meta.url))
);
const repoRoot = path.resolve(benchmarkRoot, "../..");
const manifest = readManifest("private-534-564-diagnostic-canaries.json");

const metadataCanaryScenarioIds = [
  "private-root-finished-work-commit-handoff-canary",
  "private-root-lane-priority-scheduling-canary",
  "private-function-component-callback-layout-context-canary",
  "private-test-renderer-root-create-preflight-canary",
  "private-test-renderer-tojson-update-unmount-canary",
  "private-test-renderer-act-nested-scope-canary",
  "private-react-dom-facade-nested-host-output-canary",
  "private-dom-change-focus-portal-event-canary",
  "private-hydration-resource-form-boundary-canary",
  "private-resource-script-module-preinit-canary",
  "private-controlled-restore-write-flush-blocker-canary",
  "private-form-action-formdata-blocker-canary",
  "private-scheduler-mock-frame-budget-canary",
  "private-scheduler-posttask-delay-abort-canary",
  "private-native-json-batch-response-sequence-canary",
  "private-react-transition-suspense-offscreen-blocker-canary",
  "private-dom-style-dangerous-html-text-reset-canary",
  "private-react-clone-element-child-array-freeze-canary"
];

const diagnosticCanaryScenarioIds = metadataCanaryScenarioIds.slice(0, -1);
const cloneMismatchScenarioId =
  "private-react-clone-element-child-array-freeze-canary";

const privateGateIds = [
  "reconciler-root-finished-work-commit-handoff-private-gate",
  "reconciler-root-lane-priority-scheduling-private-gate",
  "react-function-component-callback-layout-context-private-gate",
  "react-test-renderer-root-create-preflight-private-gate",
  "react-test-renderer-tojson-update-unmount-private-gate",
  "react-test-renderer-act-nested-scope-private-gate",
  "react-dom-facade-nested-host-output-private-gate",
  "react-dom-change-focus-portal-event-private-gate",
  "react-dom-hydration-resource-form-boundary-private-gate",
  "react-dom-resource-script-module-preinit-private-gate",
  "react-dom-controlled-restore-write-flush-private-gate",
  "react-dom-form-action-formdata-blocker-private-gate",
  "scheduler-mock-frame-budget-private-gate",
  "scheduler-posttask-delay-abort-private-gate",
  "native-json-batch-response-sequence-private-gate",
  "react-transition-suspense-offscreen-blocker-private-gate",
  "react-dom-style-dangerous-html-text-reset-private-gate",
  "react-clone-element-child-array-freeze-private-gate"
];

const publicCompatibilityGateIds = [
  "react-dom-root-render-e2e-public-compatibility",
  "react-dom-root-public-facade-blocked-gate",
  "react-dom-event-public-compatibility",
  "react-dom-hydration-public-compatibility",
  "react-dom-resource-public-compatibility",
  "react-dom-form-actions-public-compatibility",
  "react-dom-controlled-input-public-compatibility",
  "react-dom-style-dangerous-html-public-compatibility",
  "react-dom-portal-public-compatibility",
  "react-test-renderer-root-public-compatibility",
  "react-test-renderer-serialization-public-compatibility",
  "react-test-renderer-act-public-compatibility",
  "scheduler-mock-public-compatibility",
  "scheduler-post-task-public-compatibility",
  "fast-react-native-public-compatibility",
  "react-hooks-public-compatibility",
  "reconciler-suspense-offscreen-public-compatibility",
  "react-element-object-public-compatibility"
];

const scenarioGatePairs = [
  [
    "private-root-finished-work-commit-handoff-canary",
    "reconciler-root-finished-work-commit-handoff-private-gate"
  ],
  [
    "private-root-lane-priority-scheduling-canary",
    "reconciler-root-lane-priority-scheduling-private-gate"
  ],
  [
    "private-function-component-callback-layout-context-canary",
    "react-function-component-callback-layout-context-private-gate"
  ],
  [
    "private-test-renderer-root-create-preflight-canary",
    "react-test-renderer-root-create-preflight-private-gate"
  ],
  [
    "private-test-renderer-tojson-update-unmount-canary",
    "react-test-renderer-tojson-update-unmount-private-gate"
  ],
  [
    "private-test-renderer-act-nested-scope-canary",
    "react-test-renderer-act-nested-scope-private-gate"
  ],
  [
    "private-react-dom-facade-nested-host-output-canary",
    "react-dom-facade-nested-host-output-private-gate"
  ],
  [
    "private-dom-change-focus-portal-event-canary",
    "react-dom-change-focus-portal-event-private-gate"
  ],
  [
    "private-hydration-resource-form-boundary-canary",
    "react-dom-hydration-resource-form-boundary-private-gate"
  ],
  [
    "private-resource-script-module-preinit-canary",
    "react-dom-resource-script-module-preinit-private-gate"
  ],
  [
    "private-controlled-restore-write-flush-blocker-canary",
    "react-dom-controlled-restore-write-flush-private-gate"
  ],
  [
    "private-form-action-formdata-blocker-canary",
    "react-dom-form-action-formdata-blocker-private-gate"
  ],
  [
    "private-scheduler-mock-frame-budget-canary",
    "scheduler-mock-frame-budget-private-gate"
  ],
  [
    "private-scheduler-posttask-delay-abort-canary",
    "scheduler-posttask-delay-abort-private-gate"
  ],
  [
    "private-native-json-batch-response-sequence-canary",
    "native-json-batch-response-sequence-private-gate"
  ],
  [
    "private-react-transition-suspense-offscreen-blocker-canary",
    "react-transition-suspense-offscreen-blocker-private-gate"
  ],
  [
    "private-dom-style-dangerous-html-text-reset-canary",
    "react-dom-style-dangerous-html-text-reset-private-gate"
  ],
  [
    "private-react-clone-element-child-array-freeze-canary",
    "react-clone-element-child-array-freeze-private-gate"
  ]
];

const expectedWorkerIds = [
  "534",
  "535",
  "536",
  "537",
  "538",
  "539",
  "540",
  "541",
  "542",
  "543",
  "544",
  "545",
  "546",
  "547",
  "548",
  "549",
  "550",
  "551",
  "552",
  "557",
  "558",
  "559",
  "560",
  "561",
  "562",
  "564"
];

test("private 534-564 diagnostic benchmark canaries stay metadata-only", () => {
  const result = assertBenchmarkGate({ benchmarkRoot, repoRoot });
  const checkedManifest = result.manifests.find(
    (entry) => entry.manifestId === manifest.manifestId
  );

  assert.ok(checkedManifest);
  assert.deepEqual(checkedManifest.requiredScenarioIds, metadataCanaryScenarioIds);
  assert.deepEqual(
    checkedManifest.scenarios.map((scenario) => scenario.id),
    metadataCanaryScenarioIds
  );

  for (const gateId of privateGateIds) {
    const gate = checkedManifest.conformanceGates.find(
      (entry) => entry.id === gateId
    );
    assert.equal(gate.acceptedGate.status, "accepted-private-partial");
    assert.equal(gate.acceptedGate.admitted, true);
    assert.equal(gate.acceptedGate.compatibilityClaimed, false);
  }

  for (const gateId of publicCompatibilityGateIds) {
    const gate = checkedManifest.conformanceGates.find(
      (entry) => entry.id === gateId
    );
    assert.equal(gate.acceptedGate.status, "accepted-blocked");
    assert.equal(gate.acceptedGate.admitted, false);
    assert.equal(gate.acceptedGate.compatibilityClaimed, false);
  }

  for (const [scenarioId, gateId] of scenarioGatePairs) {
    const scenario = checkedManifest.scenarios.find(
      (entry) => entry.id === scenarioId
    );
    assert.deepEqual(scenario.conformanceGateIds, [gateId]);
    assert.equal(scenario.timingDataPolicy, "diagnostic-until-compatible");
    assert.ok(!["comparable", "noise-bound", "regression", "improvement"].includes(
      scenario.timingStatus
    ));
  }

  for (const scenarioId of diagnosticCanaryScenarioIds) {
    const scenario = checkedManifest.scenarios.find(
      (entry) => entry.id === scenarioId
    );
    assert.equal(
      scenario.compatibilityStatus,
      "matched-but-compatibility-not-claimed"
    );
    assert.equal(scenario.timingStatus, "diagnostic-only");
    assert.match(scenario.blockedReason, /private/i);
    assert.match(scenario.blockedReason, /compatibility/i);
    assert.match(scenario.blockedReason, /comparable timing remain[s]? blocked/i);
  }

  const cloneScenario = checkedManifest.scenarios.find(
    (entry) => entry.id === cloneMismatchScenarioId
  );
  assert.equal(cloneScenario.compatibilityStatus, "known-mismatch");
  assert.equal(cloneScenario.timingStatus, "not-collected");
  assert.match(cloneScenario.blockedReason, /known-mismatch/i);
  assert.match(cloneScenario.blockedReason, /React 19\.2\.6/i);
  assert.match(cloneScenario.blockedReason, /comparable timing remain[s]? blocked/i);

  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[0], [
    /finished-work/i,
    /commit-consumption/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[2], [
    /useCallback/i,
    /layout-effect/i,
    /context lane/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[7], [
    /input\/change/i,
    /focus\/blur/i,
    /portal owner-root/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[10], [
    /restore queue write/i,
    /flush-blocker/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[13], [
    /postTask/i,
    /delay-plus-abort/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[16], [
    /dangerousHTML/i,
    /text reset/i
  ]);

  const diagnosticMilestone = checkedManifest.milestones.find(
    (entry) => entry.id === "private-534-564-diagnostic-canaries-admission"
  );
  assert.deepEqual(diagnosticMilestone.scenarioIds, diagnosticCanaryScenarioIds);
  assert.deepEqual(diagnosticMilestone.conformanceGateIds, privateGateIds.slice(0, -1));
  assert.equal(
    diagnosticMilestone.compatibilityStatus,
    "matched-but-compatibility-not-claimed"
  );
  assert.equal(diagnosticMilestone.timingStatus, "diagnostic-only");
  assert.equal(
    diagnosticMilestone.benchmarkReadinessStatus,
    "diagnostic-admitted"
  );

  const cloneMilestone = checkedManifest.milestones.find(
    (entry) => entry.id === "private-534-564-react-clone-known-mismatch-blocked"
  );
  assert.deepEqual(cloneMilestone.scenarioIds, [cloneMismatchScenarioId]);
  assert.equal(cloneMilestone.compatibilityStatus, "known-mismatch");
  assert.equal(cloneMilestone.timingStatus, "not-collected");
  assert.equal(
    cloneMilestone.benchmarkReadinessStatus,
    "blocked-by-conformance"
  );

  const publicPromotionMilestone = checkedManifest.milestones.find(
    (entry) => entry.id === "private-534-564-public-promotion-blocked"
  );
  assert.deepEqual(publicPromotionMilestone.scenarioIds, metadataCanaryScenarioIds);
  assert.deepEqual(
    publicPromotionMilestone.conformanceGateIds,
    publicCompatibilityGateIds
  );
  assert.equal(
    publicPromotionMilestone.compatibilityStatus,
    "blocked-by-conformance"
  );
  assert.equal(publicPromotionMilestone.timingStatus, "blocked-by-conformance");
  assert.equal(
    publicPromotionMilestone.benchmarkReadinessStatus,
    "blocked-by-conformance"
  );
});

test("private 534-564 manifest evidence rejects stale worker ids and missing diagnostic files", () => {
  assert.deepEqual(validateManifestWorkerEvidence(manifest), []);

  const staleWorkerCandidate = clone(manifest);
  staleWorkerCandidate.conformanceGates[0].acceptedGate.notes =
    staleWorkerCandidate.conformanceGates[0].acceptedGate.notes.replace(
      "Worker 534",
      "Worker 999"
    );
  assert.match(
    validateManifestWorkerEvidence(staleWorkerCandidate).join("\n"),
    /stale or unexpected worker id 999/
  );

  const missingFileCandidate = clone(manifest);
  missingFileCandidate.scenarios[0].entrypoints[0] =
    "tests/benchmarks/missing-private-diagnostic-file.js";
  assert.match(
    validateManifestWorkerEvidence(missingFileCandidate).join("\n"),
    /missing diagnostic file tests\/benchmarks\/missing-private-diagnostic-file\.js/
  );
});

test("private 534-564 diagnostic canaries reject claim-capable timing", () => {
  const candidate = clone(manifest);
  candidate.scenarios[0].timingStatus = "improvement";

  const errors = validateBenchmarkManifest(candidate, { repoRoot });

  assert.match(
    errors.join("\n"),
    /timingStatus improvement requires compatibilityStatus green/
  );
});

test("private 534-564 public promotion stays blocked before green gates", () => {
  const candidate = clone(manifest);
  const milestone = candidate.milestones.find(
    (entry) => entry.id === "private-534-564-public-promotion-blocked"
  );
  milestone.compatibilityStatus = "green";
  milestone.timingStatus = "comparable";
  milestone.benchmarkReadinessStatus = "comparable-admitted";

  const errors = validateBenchmarkManifest(candidate, { repoRoot });
  const joined = errors.join("\n");

  assert.match(
    joined,
    /unsupported green compatibility claim; react-dom-root-render-e2e-public-compatibility acceptedGate\.admitted=false/
  );
  assert.match(
    joined,
    /unsupported green compatibility claim; react-test-renderer-root-public-compatibility acceptedGate\.compatibilityClaimed=false/
  );
  assert.match(
    joined,
    /unsupported green compatibility claim; scheduler-mock-public-compatibility acceptedGate\.admitted=false/
  );
  assert.match(
    joined,
    /unsupported green compatibility claim; react-element-object-public-compatibility acceptedGate\.compatibilityClaimed=false/
  );
});

test("private 534-564 cloneElement known mismatch cannot become comparable timing evidence", () => {
  const result = {
    schemaVersion: 1,
    kind: "fast-react-benchmark-result",
    manifestId: manifest.manifestId,
    generatedTimestampIncluded: false,
    scenarioResults: [
      {
        scenarioId: cloneMismatchScenarioId,
        implementation: "fast-react-private-react-clone-known-mismatch",
        lane: "default-node-development-private-diagnostic",
        timingStatus: "comparable"
      }
    ]
  };

  const errors = validateBenchmarkResult(result, {
    manifestById: new Map([[manifest.manifestId, manifest]])
  });

  assert.match(
    errors.join("\n"),
    /result scenario private-react-clone-element-child-array-freeze-canary: timingStatus comparable requires compatibilityStatus green/
  );
});

function validateManifestWorkerEvidence(candidate) {
  const errors = [];
  const expectedWorkerIdSet = new Set(expectedWorkerIds);
  const seenWorkerIds = new Set();

  for (const gate of candidate.conformanceGates ?? []) {
    const notes = gate.acceptedGate?.notes;
    if (typeof notes !== "string") {
      continue;
    }
    for (const workerId of extractWorkerIds(notes)) {
      seenWorkerIds.add(workerId);
      if (!expectedWorkerIdSet.has(workerId)) {
        errors.push(`stale or unexpected worker id ${workerId}`);
      }
      const workerFiles = readdirSync(path.join(repoRoot, "worker-progress"))
        .filter((entry) => entry.startsWith(`worker-${workerId}-`) && entry.endsWith(".md"));
      if (workerFiles.length !== 1) {
        errors.push(`missing worker progress report for worker ${workerId}`);
      }
    }

    const artifactPath = path.resolve(repoRoot, gate.artifact);
    if (!artifactPath.startsWith(repoRoot) || !existsSync(artifactPath)) {
      errors.push(`missing diagnostic artifact ${gate.artifact}`);
    }
  }

  for (const workerId of expectedWorkerIds) {
    if (!seenWorkerIds.has(workerId)) {
      errors.push(`missing expected worker id ${workerId}`);
    }
  }

  for (const scenario of candidate.scenarios ?? []) {
    for (const entrypoint of scenario.entrypoints ?? []) {
      const entrypointPath = path.resolve(repoRoot, entrypoint);
      if (!entrypointPath.startsWith(repoRoot) || !existsSync(entrypointPath)) {
        errors.push(`missing diagnostic file ${entrypoint}`);
      }
    }
  }

  return errors;
}

function extractWorkerIds(notes) {
  const workerIds = [];
  const workerMentions = notes.matchAll(/\bWorkers?\s+([0-9,\sand]+)/g);
  for (const mention of workerMentions) {
    for (const workerId of mention[1].matchAll(/\d+/g)) {
      workerIds.push(workerId[0]);
    }
  }
  return workerIds;
}

function assertScenarioReason(checkedManifest, scenarioId, patterns) {
  const scenario = checkedManifest.scenarios.find(
    (entry) => entry.id === scenarioId
  );
  for (const pattern of patterns) {
    assert.match(scenario.blockedReason, pattern);
  }
}

function readManifest(fileName) {
  return JSON.parse(
    readFileSync(path.join(benchmarkRoot, "manifests", fileName), "utf8")
  );
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
