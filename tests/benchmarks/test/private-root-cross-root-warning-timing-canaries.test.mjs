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
const manifest = readManifest(
  "private-root-cross-root-warning-timing-canaries.json"
);

const timingCanaryScenarioIds = [
  "private-root-host-output-cross-root-flushsync-timing-canary",
  "private-root-warning-boundary-root-output-timing-canary"
];

const privateGateIds = [
  "react-dom-root-private-host-output-flushsync-gate",
  "react-dom-root-private-warning-boundary-gate"
];

const publicCompatibilityGateIds = [
  "react-dom-root-render-e2e-public-compatibility",
  "react-dom-root-public-facade-blocked-gate"
];

test("private cross-root and warning timing canaries stay diagnostic-only", () => {
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

  const [flushSyncScenario, warningScenario] = checkedManifest.scenarios;
  assert.deepEqual(flushSyncScenario.conformanceGateIds, [
    "react-dom-root-private-host-output-flushsync-gate"
  ]);
  assert.match(flushSyncScenario.blockedReason, /public flushSync/i);
  assert.match(flushSyncScenario.blockedReason, /comparable timing remain[s]? blocked/i);

  assert.deepEqual(warningScenario.conformanceGateIds, [
    "react-dom-root-private-warning-boundary-gate"
  ]);
  assert.match(warningScenario.blockedReason, /console output/i);
  assert.match(warningScenario.blockedReason, /public warning compatibility/i);
  assert.match(warningScenario.blockedReason, /comparable timing remain[s]? blocked/i);

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
      entry.id ===
      "private-root-cross-root-warning-timing-canaries-diagnostic-admission"
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
      entry.id ===
      "private-root-cross-root-warning-public-timing-promotion-blocked"
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

test("private cross-root and warning timing canaries reject claim-capable timing", () => {
  const candidate = clone(manifest);
  candidate.scenarios[1].timingStatus = "improvement";

  const errors = validateBenchmarkManifest(candidate, { repoRoot });

  assert.match(
    errors.join("\n"),
    /timingStatus improvement requires compatibilityStatus green/
  );
});

test("private cross-root and warning timing canaries reject public promotion before green gates", () => {
  const candidate = clone(manifest);
  const milestone = candidate.milestones.find(
    (entry) =>
      entry.id ===
      "private-root-cross-root-warning-public-timing-promotion-blocked"
  );
  milestone.compatibilityStatus = "green";
  milestone.timingStatus = "comparable";
  milestone.benchmarkReadinessStatus = "comparable-admitted";

  const errors = validateBenchmarkManifest(candidate, { repoRoot });
  const joined = errors.join("\n");

  assert.match(
    joined,
    /unsupported green compatibility claim; react-dom-root-render-e2e-public-compatibility has conformanceClaims\.compatibilityClaimed=false/
  );
  assert.match(
    joined,
    /unsupported green compatibility claim; react-dom-root-render-e2e-public-compatibility acceptedGate\.admitted=false/
  );
  assert.match(
    joined,
    /unsupported green compatibility claim; react-dom-root-public-facade-blocked-gate acceptedGate\.compatibilityClaimed=false/
  );
});

test("private warning timing canary rejects diagnostic admission through public gates", () => {
  const candidate = clone(manifest);
  candidate.scenarios[1].conformanceGateIds.push(
    "react-dom-root-public-facade-blocked-gate"
  );

  const errors = validateBenchmarkManifest(candidate, { repoRoot });

  assert.match(
    errors.join("\n"),
    /scenario private-root-warning-boundary-root-output-timing-canary: diagnostic private admission requires react-dom-root-public-facade-blocked-gate acceptedGate.status=accepted-private-partial, admitted=true, and compatibilityClaimed=false/
  );
});

test("private cross-root and warning timing result artifacts cannot become comparable", () => {
  const result = {
    schemaVersion: 1,
    kind: "fast-react-benchmark-result",
    manifestId: manifest.manifestId,
    generatedTimestampIncluded: false,
    scenarioResults: [
      {
        scenarioId: "private-root-host-output-cross-root-flushsync-timing-canary",
        implementation: "fast-react-private-root-bridge",
        lane: "default-node-development-private-fake-dom",
        timingStatus: "comparable"
      }
    ]
  };

  const errors = validateBenchmarkResult(result, {
    manifestById: new Map([[manifest.manifestId, manifest]])
  });

  assert.match(
    errors.join("\n"),
    /result scenario private-root-host-output-cross-root-flushsync-timing-canary: timingStatus comparable requires compatibilityStatus green/
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
