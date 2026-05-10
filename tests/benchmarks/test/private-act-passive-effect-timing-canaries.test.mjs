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
const manifest = readManifest("private-act-passive-effect-timing-canaries.json");

const timingCanaryScenarioIds = [
  "private-act-renderer-backed-passive-drain-timing-canary",
  "private-passive-effect-mount-unmount-execution-timing-canary",
  "private-passive-effect-error-routing-timing-canary"
];

const privateGateIds = [
  "react-private-renderer-backed-act-passive-drain-gate",
  "react-test-renderer-private-act-passive-drain-gate",
  "reconciler-private-passive-effect-mount-unmount-execution-gate",
  "reconciler-private-passive-effect-error-routing-gate"
];

const publicCompatibilityGateIds = [
  "react-act-public-compatibility",
  "react-test-renderer-act-public-compatibility",
  "react-test-renderer-error-surface-public-compatibility"
];

test("private act passive-drain and passive effect timing canaries stay diagnostic-only", () => {
  const result = assertBenchmarkGate({ benchmarkRoot, repoRoot });
  const checkedManifest = result.manifests.find(
    (entry) => entry.manifestId === manifest.manifestId
  );

  assert.ok(checkedManifest);
  assert.deepEqual(checkedManifest.requiredScenarioIds, timingCanaryScenarioIds);
  assert.deepEqual(
    checkedManifest.scenarios.map((scenario) => scenario.id),
    timingCanaryScenarioIds
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

  const [actDrainScenario, mountUnmountScenario, errorRoutingScenario] =
    checkedManifest.scenarios;
  assert.deepEqual(actDrainScenario.conformanceGateIds, [
    "react-private-renderer-backed-act-passive-drain-gate",
    "react-test-renderer-private-act-passive-drain-gate"
  ]);
  assert.match(actDrainScenario.blockedReason, /renderer-backed act drain/i);
  assert.match(actDrainScenario.blockedReason, /passive flush metadata/i);
  assert.match(actDrainScenario.blockedReason, /public React\.act/i);
  assert.match(actDrainScenario.blockedReason, /comparable timing remain[s]? blocked/i);

  assert.deepEqual(mountUnmountScenario.conformanceGateIds, [
    "reconciler-private-passive-effect-mount-unmount-execution-gate"
  ]);
  assert.match(mountUnmountScenario.blockedReason, /test-control destroy/i);
  assert.match(mountUnmountScenario.blockedReason, /mount-create callback/i);
  assert.match(mountUnmountScenario.blockedReason, /scheduler-driven passive execution/i);
  assert.match(mountUnmountScenario.blockedReason, /public act compatibility/i);

  assert.deepEqual(errorRoutingScenario.conformanceGateIds, [
    "reconciler-private-passive-effect-error-routing-gate"
  ]);
  assert.match(errorRoutingScenario.blockedReason, /root error capture scheduling/i);
  assert.match(errorRoutingScenario.blockedReason, /public error-surface compatibility/i);
  assert.match(errorRoutingScenario.blockedReason, /public act error aggregation/i);
  assert.match(errorRoutingScenario.blockedReason, /comparable timing remain[s]? blocked/i);

  for (const scenario of checkedManifest.scenarios) {
    assert.equal(
      scenario.compatibilityStatus,
      "matched-but-compatibility-not-claimed"
    );
    assert.equal(scenario.timingStatus, "diagnostic-only");
    assert.equal(scenario.timingDataPolicy, "diagnostic-until-compatible");
  }

  const diagnosticMilestone = checkedManifest.milestones.find(
    (entry) =>
      entry.id === "private-act-passive-effect-timing-canaries-diagnostic-admission"
  );
  assert.deepEqual(diagnosticMilestone.scenarioIds, timingCanaryScenarioIds);
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
    (entry) =>
      entry.id === "private-act-passive-effect-public-timing-promotion-blocked"
  );
  assert.deepEqual(publicPromotionMilestone.scenarioIds, timingCanaryScenarioIds);
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

test("private act passive-drain and passive effect timing canaries reject claim-capable timing", () => {
  const candidate = clone(manifest);
  candidate.scenarios[0].timingStatus = "regression";

  const errors = validateBenchmarkManifest(candidate, { repoRoot });

  assert.match(
    errors.join("\n"),
    /timingStatus regression requires compatibilityStatus green/
  );
});

test("private act passive-drain and passive effect timing canaries reject public promotion before green gates", () => {
  const candidate = clone(manifest);
  const milestone = candidate.milestones.find(
    (entry) =>
      entry.id === "private-act-passive-effect-public-timing-promotion-blocked"
  );
  milestone.compatibilityStatus = "green";
  milestone.timingStatus = "comparable";
  milestone.benchmarkReadinessStatus = "comparable-admitted";

  const errors = validateBenchmarkManifest(candidate, { repoRoot });
  const joined = errors.join("\n");

  assert.match(
    joined,
    /unsupported green compatibility claim; react-act-public-compatibility has conformanceClaims\.compatibilityClaimed=false/
  );
  assert.match(
    joined,
    /unsupported green compatibility claim; react-test-renderer-act-public-compatibility acceptedGate\.admitted=false/
  );
  assert.match(
    joined,
    /unsupported green compatibility claim; react-test-renderer-error-surface-public-compatibility acceptedGate\.compatibilityClaimed=false/
  );
});

test("private passive effect error timing canary rejects diagnostic admission through public gates", () => {
  const candidate = clone(manifest);
  candidate.scenarios[2].conformanceGateIds.push(
    "react-test-renderer-error-surface-public-compatibility"
  );

  const errors = validateBenchmarkManifest(candidate, { repoRoot });

  assert.match(
    errors.join("\n"),
    /scenario private-passive-effect-error-routing-timing-canary: diagnostic private admission requires react-test-renderer-error-surface-public-compatibility acceptedGate.status=accepted-private-partial, admitted=true, and compatibilityClaimed=false/
  );
});

test("private act passive-drain timing result artifacts cannot become comparable", () => {
  const result = {
    schemaVersion: 1,
    kind: "fast-react-benchmark-result",
    manifestId: manifest.manifestId,
    generatedTimestampIncluded: false,
    scenarioResults: [
      {
        scenarioId: "private-act-renderer-backed-passive-drain-timing-canary",
        implementation: "fast-react-private-renderer-backed-act-drain",
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
    /result scenario private-act-renderer-backed-passive-drain-timing-canary: timingStatus comparable requires compatibilityStatus green/
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
