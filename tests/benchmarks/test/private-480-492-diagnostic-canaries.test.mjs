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
const manifest = readManifest("private-480-492-diagnostic-canaries.json");

const metadataCanaryScenarioIds = [
  "private-react-dom-root-facade-host-output-metadata-canary",
  "private-react-dom-root-event-listener-error-routing-metadata-canary",
  "private-resource-stylesheet-precedence-metadata-canary",
  "private-form-submit-reset-action-metadata-canary",
  "private-controlled-checkbox-radio-restore-metadata-canary",
  "private-test-renderer-deletion-cleanup-order-metadata-canary",
  "private-test-renderer-act-scheduler-flush-metadata-canary",
  "private-test-renderer-flushsync-act-routing-metadata-canary",
  "private-test-instance-findby-query-metadata-canary",
  "private-test-renderer-totree-multichild-metadata-canary"
];

const privateGateIds = [
  "react-dom-root-private-facade-host-output-gate",
  "react-dom-root-private-event-listener-error-routing-gate",
  "react-dom-resource-private-stylesheet-precedence-gate",
  "react-dom-form-private-submit-reset-metadata-gate",
  "react-dom-controlled-private-checkbox-radio-restore-gate",
  "react-test-renderer-private-deletion-cleanup-order-gate",
  "react-test-renderer-private-act-scheduler-flush-gate",
  "react-test-renderer-private-flushsync-act-routing-gate",
  "react-test-renderer-private-findby-query-gate",
  "react-test-renderer-private-totree-multichild-gate"
];

const publicCompatibilityGateIds = [
  "react-dom-root-render-e2e-public-compatibility",
  "react-dom-root-public-facade-blocked-gate",
  "react-dom-resource-public-compatibility",
  "react-dom-form-actions-public-compatibility",
  "react-dom-controlled-input-public-compatibility",
  "react-test-renderer-root-public-compatibility",
  "react-test-renderer-act-public-compatibility",
  "react-test-renderer-serialization-public-compatibility"
];

const scenarioGatePairs = [
  [
    "private-react-dom-root-facade-host-output-metadata-canary",
    "react-dom-root-private-facade-host-output-gate"
  ],
  [
    "private-react-dom-root-event-listener-error-routing-metadata-canary",
    "react-dom-root-private-event-listener-error-routing-gate"
  ],
  [
    "private-resource-stylesheet-precedence-metadata-canary",
    "react-dom-resource-private-stylesheet-precedence-gate"
  ],
  [
    "private-form-submit-reset-action-metadata-canary",
    "react-dom-form-private-submit-reset-metadata-gate"
  ],
  [
    "private-controlled-checkbox-radio-restore-metadata-canary",
    "react-dom-controlled-private-checkbox-radio-restore-gate"
  ],
  [
    "private-test-renderer-deletion-cleanup-order-metadata-canary",
    "react-test-renderer-private-deletion-cleanup-order-gate"
  ],
  [
    "private-test-renderer-act-scheduler-flush-metadata-canary",
    "react-test-renderer-private-act-scheduler-flush-gate"
  ],
  [
    "private-test-renderer-flushsync-act-routing-metadata-canary",
    "react-test-renderer-private-flushsync-act-routing-gate"
  ],
  [
    "private-test-instance-findby-query-metadata-canary",
    "react-test-renderer-private-findby-query-gate"
  ],
  [
    "private-test-renderer-totree-multichild-metadata-canary",
    "react-test-renderer-private-totree-multichild-gate"
  ]
];

test("private 480-492 diagnostic benchmark canaries stay metadata-only", () => {
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
    assert.match(scenario.blockedReason, /metadata/i);
    assert.match(scenario.blockedReason, /public/i);
    assert.match(scenario.blockedReason, /compatibility/i);
    assert.match(scenario.blockedReason, /comparable timing remain[s]? blocked/i);
  }

  const rootFacadeScenario = checkedManifest.scenarios[0];
  assert.match(rootFacadeScenario.blockedReason, /root bridge/i);
  assert.match(rootFacadeScenario.blockedReason, /fake DOM/i);

  const eventErrorScenario = checkedManifest.scenarios[1];
  assert.match(eventErrorScenario.blockedReason, /listener error-route metadata/i);
  assert.match(eventErrorScenario.blockedReason, /root option callback records/i);

  const resourceScenario = checkedManifest.scenarios[2];
  assert.match(resourceScenario.blockedReason, /stylesheet precedence/i);
  assert.match(resourceScenario.blockedReason, /real DOM mutation/i);

  const formScenario = checkedManifest.scenarios[3];
  assert.match(formScenario.blockedReason, /submit\/requestSubmit/i);
  assert.match(formScenario.blockedReason, /FormData/i);

  const controlledScenario = checkedManifest.scenarios[4];
  assert.match(controlledScenario.blockedReason, /checkbox\/radio/i);
  assert.match(controlledScenario.blockedReason, /value tracking/i);

  const deletionScenario = checkedManifest.scenarios[5];
  assert.match(deletionScenario.blockedReason, /deletion cleanup order/i);
  assert.match(deletionScenario.blockedReason, /passive destroy execution/i);

  const actScenario = checkedManifest.scenarios[6];
  assert.match(actScenario.blockedReason, /Scheduler flush-helper/i);
  assert.match(actScenario.blockedReason, /public act queue draining/i);

  const flushSyncScenario = checkedManifest.scenarios[7];
  assert.match(flushSyncScenario.blockedReason, /unstable_flushSync/i);
  assert.match(flushSyncScenario.blockedReason, /sync-flush/i);

  const findByScenario = checkedManifest.scenarios[8];
  assert.match(findByScenario.blockedReason, /findByType and findByProps/i);
  assert.match(findByScenario.blockedReason, /TestInstance query methods/i);

  const toTreeScenario = checkedManifest.scenarios[9];
  assert.match(toTreeScenario.blockedReason, /toTree multi-child/i);
  assert.match(toTreeScenario.blockedReason, /public serialization/i);

  const diagnosticMilestone = checkedManifest.milestones.find(
    (entry) => entry.id === "private-480-492-diagnostic-canaries-admission"
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
    (entry) => entry.id === "private-480-492-public-promotion-blocked"
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

test("private 480-492 diagnostic canaries reject claim-capable timing", () => {
  const candidate = clone(manifest);
  candidate.scenarios[0].timingStatus = "improvement";

  const errors = validateBenchmarkManifest(candidate, { repoRoot });

  assert.match(
    errors.join("\n"),
    /timingStatus improvement requires compatibilityStatus green/
  );
});

test("private 480-492 diagnostic canaries reject public promotion before green gates", () => {
  const candidate = clone(manifest);
  const milestone = candidate.milestones.find(
    (entry) => entry.id === "private-480-492-public-promotion-blocked"
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
    /unsupported green compatibility claim; react-dom-resource-public-compatibility acceptedGate\.compatibilityClaimed=false/
  );
  assert.match(
    joined,
    /unsupported green compatibility claim; react-dom-controlled-input-public-compatibility acceptedGate\.admitted=false/
  );
  assert.match(
    joined,
    /unsupported green compatibility claim; react-test-renderer-serialization-public-compatibility acceptedGate\.compatibilityClaimed=false/
  );
});

test("private 480-492 diagnostic canaries reject diagnostic admission through public gates", () => {
  const candidate = clone(manifest);
  candidate.scenarios[3].conformanceGateIds.push(
    "react-dom-form-actions-public-compatibility"
  );

  const errors = validateBenchmarkManifest(candidate, { repoRoot });

  assert.match(
    errors.join("\n"),
    /scenario private-form-submit-reset-action-metadata-canary: diagnostic private admission requires react-dom-form-actions-public-compatibility acceptedGate.status=accepted-private-partial, admitted=true, and compatibilityClaimed=false/
  );
});

test("private 480-492 diagnostic result artifacts cannot become comparable", () => {
  const result = {
    schemaVersion: 1,
    kind: "fast-react-benchmark-result",
    manifestId: manifest.manifestId,
    generatedTimestampIncluded: false,
    scenarioResults: [
      {
        scenarioId: "private-test-renderer-totree-multichild-metadata-canary",
        implementation: "fast-react-private-test-renderer-metadata",
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
    /result scenario private-test-renderer-totree-multichild-metadata-canary: timingStatus comparable requires compatibilityStatus green/
  );
});

function readManifest(fileName) {
  return JSON.parse(
    readFileSync(path.join(benchmarkRoot, "manifests", fileName), "utf8")
  );
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
