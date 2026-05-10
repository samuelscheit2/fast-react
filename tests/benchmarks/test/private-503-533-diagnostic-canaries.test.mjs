import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
const manifest = readManifest("private-503-533-diagnostic-canaries.json");

const metadataCanaryScenarioIds = [
  "private-deleted-subtree-passive-fragment-portal-cleanup-canary",
  "private-form-event-reset-queue-commit-canary",
  "private-resource-map-load-error-state-canary",
  "private-controlled-restore-radio-queue-write-canary",
  "private-react-dom-facade-update-unmount-host-output-canary",
  "private-dom-event-type-portal-error-routing-canary",
  "private-test-renderer-query-committed-fiber-canary",
  "private-test-renderer-act-warning-expired-scheduler-canary",
  "private-suspenselist-activity-blocker-shape-canary",
  "private-scheduler-posttask-environment-native-entry-canary",
  "private-native-worker-thread-teardown-package-surface-canary",
  "private-react-hook-dispatcher-public-blocker-canary",
  "private-hydration-replay-error-metadata-canary",
  "private-portal-root-render-public-blocker-canary",
  "private-test-renderer-error-boundary-update-canary"
];

const privateGateIds = [
  "reconciler-deleted-subtree-passive-fragment-portal-private-gate",
  "react-dom-form-event-reset-private-gate",
  "react-dom-resource-map-load-state-private-gate",
  "react-dom-controlled-restore-radio-queue-write-private-gate",
  "react-dom-facade-update-unmount-private-gate",
  "react-dom-event-type-portal-error-private-gate",
  "react-test-renderer-query-committed-fiber-private-gate",
  "react-test-renderer-act-warning-expired-scheduler-private-gate",
  "reconciler-suspenselist-activity-blocker-private-gate",
  "scheduler-posttask-environment-native-entry-private-gate",
  "native-worker-thread-teardown-package-surface-private-gate",
  "react-hook-dispatcher-public-blocker-private-gate",
  "react-dom-hydration-replay-error-private-gate",
  "react-dom-portal-root-render-public-blocker-private-gate",
  "react-test-renderer-error-boundary-update-private-gate"
];

const publicCompatibilityGateIds = [
  "react-dom-root-render-e2e-public-compatibility",
  "react-dom-root-public-facade-blocked-gate",
  "react-dom-event-public-compatibility",
  "react-dom-hydration-public-compatibility",
  "react-dom-portal-public-compatibility",
  "react-dom-resource-public-compatibility",
  "react-dom-form-actions-public-compatibility",
  "react-dom-controlled-input-public-compatibility",
  "react-test-renderer-root-public-compatibility",
  "react-test-renderer-act-public-compatibility",
  "react-test-renderer-serialization-public-compatibility",
  "react-test-renderer-error-surface-public-compatibility",
  "scheduler-mock-public-compatibility",
  "scheduler-post-task-public-compatibility",
  "scheduler-native-entry-public-compatibility",
  "fast-react-native-public-compatibility",
  "react-hooks-public-compatibility",
  "reconciler-unsupported-feature-public-compatibility"
];

const scenarioGatePairs = [
  [
    "private-deleted-subtree-passive-fragment-portal-cleanup-canary",
    "reconciler-deleted-subtree-passive-fragment-portal-private-gate"
  ],
  [
    "private-form-event-reset-queue-commit-canary",
    "react-dom-form-event-reset-private-gate"
  ],
  [
    "private-resource-map-load-error-state-canary",
    "react-dom-resource-map-load-state-private-gate"
  ],
  [
    "private-controlled-restore-radio-queue-write-canary",
    "react-dom-controlled-restore-radio-queue-write-private-gate"
  ],
  [
    "private-react-dom-facade-update-unmount-host-output-canary",
    "react-dom-facade-update-unmount-private-gate"
  ],
  [
    "private-dom-event-type-portal-error-routing-canary",
    "react-dom-event-type-portal-error-private-gate"
  ],
  [
    "private-test-renderer-query-committed-fiber-canary",
    "react-test-renderer-query-committed-fiber-private-gate"
  ],
  [
    "private-test-renderer-act-warning-expired-scheduler-canary",
    "react-test-renderer-act-warning-expired-scheduler-private-gate"
  ],
  [
    "private-suspenselist-activity-blocker-shape-canary",
    "reconciler-suspenselist-activity-blocker-private-gate"
  ],
  [
    "private-scheduler-posttask-environment-native-entry-canary",
    "scheduler-posttask-environment-native-entry-private-gate"
  ],
  [
    "private-native-worker-thread-teardown-package-surface-canary",
    "native-worker-thread-teardown-package-surface-private-gate"
  ],
  [
    "private-react-hook-dispatcher-public-blocker-canary",
    "react-hook-dispatcher-public-blocker-private-gate"
  ],
  [
    "private-hydration-replay-error-metadata-canary",
    "react-dom-hydration-replay-error-private-gate"
  ],
  [
    "private-portal-root-render-public-blocker-canary",
    "react-dom-portal-root-render-public-blocker-private-gate"
  ],
  [
    "private-test-renderer-error-boundary-update-canary",
    "react-test-renderer-error-boundary-update-private-gate"
  ]
];

test("private 503-533 diagnostic benchmark canaries stay metadata-only", () => {
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
    assert.equal(
      scenario.compatibilityStatus,
      "matched-but-compatibility-not-claimed"
    );
    assert.equal(scenario.timingStatus, "diagnostic-only");
    assert.equal(scenario.timingDataPolicy, "diagnostic-until-compatible");
    assert.match(scenario.blockedReason, /private/i);
    assert.match(scenario.blockedReason, /compatibility/i);
    assert.match(scenario.blockedReason, /comparable timing remain[s]? blocked/i);
  }

  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[0], [
    /Fragment\/Portal/i,
    /passive destroy/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[1], [
    /submit\/requestSubmit/i,
    /FormData/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[2], [
    /resource-map/i,
    /load\/error/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[3], [
    /sibling-props/i,
    /wrapper execution/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[4], [
    /root\.render/i,
    /unmount cleanup/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[5], [
    /keydown\/mousemove\/animationend/i,
    /portal listener error-routing/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[6], [
    /committed-fiber/i,
    /TestInstance queries/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[7], [
    /thenable/i,
    /expired mock Scheduler/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[8], [
    /SuspenseList/i,
    /Activity/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[9], [
    /postTask/i,
    /native-entry/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[10], [
    /worker-thread/i,
    /addon/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[11], [
    /hook dispatcher/i,
    /public hook forwarding/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[12], [
    /dehydrated ownership/i,
    /browser event replay/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[13], [
    /public-root denial/i,
    /portal DOM mutation/i
  ]);
  assertScenarioReason(checkedManifest, metadataCanaryScenarioIds[14], [
    /update\/commit/i,
    /error recovery/i
  ]);

  const diagnosticMilestone = checkedManifest.milestones.find(
    (entry) => entry.id === "private-503-533-diagnostic-canaries-admission"
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
  assert.match(diagnosticMilestone.blockedReason, /deterministic private metadata/i);
  assert.match(diagnosticMilestone.blockedReason, /comparable timing claims remain blocked/i);

  const publicPromotionMilestone = checkedManifest.milestones.find(
    (entry) => entry.id === "private-503-533-public-promotion-blocked"
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

test("private 503-533 diagnostic canaries reject claim-capable timing", () => {
  const candidate = clone(manifest);
  candidate.scenarios[0].timingStatus = "regression";

  const errors = validateBenchmarkManifest(candidate, { repoRoot });

  assert.match(
    errors.join("\n"),
    /timingStatus regression requires compatibilityStatus green/
  );
});

test("private 503-533 diagnostic canaries reject public promotion before green gates", () => {
  const candidate = clone(manifest);
  const milestone = candidate.milestones.find(
    (entry) => entry.id === "private-503-533-public-promotion-blocked"
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
    /unsupported green compatibility claim; react-test-renderer-act-public-compatibility acceptedGate\.compatibilityClaimed=false/
  );
  assert.match(
    joined,
    /unsupported green compatibility claim; scheduler-post-task-public-compatibility acceptedGate\.admitted=false/
  );
  assert.match(
    joined,
    /unsupported green compatibility claim; fast-react-native-public-compatibility acceptedGate\.compatibilityClaimed=false/
  );
});

test("private 503-533 diagnostic canaries reject diagnostic admission through public gates", () => {
  const candidate = clone(manifest);
  candidate.scenarios[1].conformanceGateIds.push(
    "react-dom-form-actions-public-compatibility"
  );

  const errors = validateBenchmarkManifest(candidate, { repoRoot });

  assert.match(
    errors.join("\n"),
    /scenario private-form-event-reset-queue-commit-canary: diagnostic private admission requires react-dom-form-actions-public-compatibility acceptedGate.status=accepted-private-partial, admitted=true, and compatibilityClaimed=false/
  );
});

test("private 503-533 diagnostic result artifacts cannot become comparable", () => {
  const result = {
    schemaVersion: 1,
    kind: "fast-react-benchmark-result",
    manifestId: manifest.manifestId,
    generatedTimestampIncluded: false,
    scenarioResults: [
      {
        scenarioId: "private-test-renderer-error-boundary-update-canary",
        implementation: "fast-react-private-test-renderer-error-metadata",
        lane: "default-node-development-private-diagnostic",
        timingStatus: "noise-bound"
      }
    ]
  };

  const errors = validateBenchmarkResult(result, {
    manifestById: new Map([[manifest.manifestId, manifest]])
  });

  assert.match(
    errors.join("\n"),
    /result scenario private-test-renderer-error-boundary-update-canary: timingStatus noise-bound requires compatibilityStatus green/
  );
});

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
