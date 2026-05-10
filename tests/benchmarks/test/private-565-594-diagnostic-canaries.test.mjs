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
const manifest = readManifest("private-565-594-diagnostic-canaries.json");

const metadataCanaryScenarioIds = [
  "private-root-commit-scheduler-queue-canary",
  "private-function-context-effect-canary",
  "private-suspense-offscreen-scheduler-canary",
  "private-test-renderer-root-workloop-canary",
  "private-test-renderer-act-serialization-canary",
  "private-react-dom-root-facade-workloop-canary",
  "private-dom-style-dangeroushtml-fake-commit-canary",
  "private-dom-event-controlled-hydration-canary",
  "private-resource-modulepreload-order-canary",
  "private-scheduler-mock-posttask-root-canary",
  "private-native-stream-batch-roundtrip-canary",
  "private-react-transition-key-ref-warning-canary"
];

const privateGateIds = [
  "reconciler-root-commit-scheduler-queue-private-gate",
  "react-function-context-effect-private-gate",
  "reconciler-suspense-offscreen-scheduler-private-gate",
  "react-test-renderer-root-workloop-private-gate",
  "react-test-renderer-act-serialization-private-gate",
  "react-dom-root-facade-workloop-private-gate",
  "react-dom-style-dangeroushtml-fake-commit-private-gate",
  "react-dom-event-controlled-hydration-private-gate",
  "react-dom-resource-modulepreload-private-gate",
  "scheduler-mock-posttask-root-private-gate",
  "native-stream-batch-roundtrip-private-gate",
  "react-transition-key-ref-private-gate"
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
    "private-root-commit-scheduler-queue-canary",
    "reconciler-root-commit-scheduler-queue-private-gate"
  ],
  [
    "private-function-context-effect-canary",
    "react-function-context-effect-private-gate"
  ],
  [
    "private-suspense-offscreen-scheduler-canary",
    "reconciler-suspense-offscreen-scheduler-private-gate"
  ],
  [
    "private-test-renderer-root-workloop-canary",
    "react-test-renderer-root-workloop-private-gate"
  ],
  [
    "private-test-renderer-act-serialization-canary",
    "react-test-renderer-act-serialization-private-gate"
  ],
  [
    "private-react-dom-root-facade-workloop-canary",
    "react-dom-root-facade-workloop-private-gate"
  ],
  [
    "private-dom-style-dangeroushtml-fake-commit-canary",
    "react-dom-style-dangeroushtml-fake-commit-private-gate"
  ],
  [
    "private-dom-event-controlled-hydration-canary",
    "react-dom-event-controlled-hydration-private-gate"
  ],
  [
    "private-resource-modulepreload-order-canary",
    "react-dom-resource-modulepreload-private-gate"
  ],
  [
    "private-scheduler-mock-posttask-root-canary",
    "scheduler-mock-posttask-root-private-gate"
  ],
  [
    "private-native-stream-batch-roundtrip-canary",
    "native-stream-batch-roundtrip-private-gate"
  ],
  [
    "private-react-transition-key-ref-warning-canary",
    "react-transition-key-ref-private-gate"
  ]
];

const expectedWorkerIds = [
  "565",
  "566",
  "567",
  "568",
  "569",
  "570",
  "571",
  "572",
  "573",
  "574",
  "575",
  "576",
  "577",
  "578",
  "579",
  "580",
  "581",
  "582",
  "583",
  "584",
  "585",
  "586",
  "587",
  "588",
  "589"
];

test("private 565-594 diagnostic benchmark canaries stay metadata-only", () => {
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
    assert.equal(scenario.compatibilityStatus, "matched-but-compatibility-not-claimed");
    assert.equal(scenario.timingStatus, "diagnostic-only");
    assert.equal(scenario.timingDataPolicy, "diagnostic-until-compatible");
    assert.match(scenario.blockedReason, /private|Workers?/i);
    assert.match(scenario.blockedReason, /comparable timing remain[s]? blocked/i);
  }

  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[0], [
    /finished-work/i,
    /callback-order/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[3], [
    /test-renderer root/i,
    /create\/update\/unmount/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[7], [
    /event\/controlled\/hydration/i,
    /replay draining/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[9], [
    /Scheduler/i,
    /root execution/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[10], [
    /native stream/i,
    /addon execution/i
  ]);

  const diagnosticMilestone = checkedManifest.milestones.find(
    (entry) => entry.id === "private-565-594-diagnostic-canaries-admission"
  );
  assert.deepEqual(diagnosticMilestone.scenarioIds, metadataCanaryScenarioIds);
  assert.deepEqual(diagnosticMilestone.conformanceGateIds, privateGateIds);
  assert.equal(
    diagnosticMilestone.compatibilityStatus,
    "matched-but-compatibility-not-claimed"
  );
  assert.equal(diagnosticMilestone.timingStatus, "diagnostic-only");
  assert.equal(
    diagnosticMilestone.benchmarkReadinessStatus,
    "diagnostic-admitted"
  );

  const publicPromotionMilestone = checkedManifest.milestones.find(
    (entry) => entry.id === "private-565-594-public-promotion-blocked"
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

test("private 565-594 manifest evidence rejects stale worker ids and missing diagnostic files", () => {
  assert.deepEqual(validateManifestWorkerEvidence(manifest), []);

  const staleWorkerCandidate = clone(manifest);
  staleWorkerCandidate.conformanceGates[0].acceptedGate.notes =
    staleWorkerCandidate.conformanceGates[0].acceptedGate.notes.replace(
      "Workers 565",
      "Workers 999"
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

test("private 565-594 diagnostic canaries reject claim-capable timing", () => {
  const candidate = clone(manifest);
  candidate.scenarios[0].timingStatus = "noise-bound";

  const errors = validateBenchmarkManifest(candidate, { repoRoot });

  assert.match(
    errors.join("\n"),
    /timingStatus noise-bound requires compatibilityStatus green/
  );
});

test("private 565-594 public promotion stays blocked before green gates", () => {
  const candidate = clone(manifest);
  const milestone = candidate.milestones.find(
    (entry) => entry.id === "private-565-594-public-promotion-blocked"
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
    /unsupported green compatibility claim; fast-react-native-public-compatibility acceptedGate\.compatibilityClaimed=false/
  );
  assert.match(
    joined,
    /unsupported green compatibility claim; react-element-object-public-compatibility acceptedGate\.compatibilityClaimed=false/
  );
});

test("private 565-594 diagnostics cannot become comparable result evidence", () => {
  const result = {
    schemaVersion: 1,
    kind: "fast-react-benchmark-result",
    manifestId: manifest.manifestId,
    generatedTimestampIncluded: false,
    scenarioResults: [
      {
        scenarioId: "private-scheduler-mock-posttask-root-canary",
        implementation: "fast-react-private-scheduler-diagnostic",
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
    /result scenario private-scheduler-mock-posttask-root-canary: timingStatus comparable requires compatibilityStatus green/
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
