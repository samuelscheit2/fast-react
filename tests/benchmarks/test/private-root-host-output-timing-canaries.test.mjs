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
const manifest = readManifest("private-root-host-output-timing-canaries.json");

const timingCanaryScenarioIds = [
  "private-root-host-output-create-mark-listen-timing-canary",
  "private-root-host-output-initial-render-timing-canary",
  "private-root-host-output-update-render-timing-canary",
  "private-root-host-output-replace-tree-timing-canary",
  "private-root-host-output-render-null-clear-timing-canary",
  "private-root-host-output-unmount-cleanup-timing-canary",
  "private-root-host-output-double-unmount-timing-canary",
  "private-root-host-output-render-after-unmount-guard-timing-canary"
];

const publicCompatibilityGateIds = [
  "react-dom-root-render-e2e-public-compatibility",
  "react-dom-root-public-facade-blocked-gate"
];

test("private root host-output timing canaries stay diagnostic-only", () => {
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

  const privateHostOutputGate = checkedManifest.conformanceGates.find(
    (gate) => gate.id === "react-dom-root-private-host-output-gate"
  );
  assert.equal(privateHostOutputGate.acceptedGate.status, "accepted-private-partial");
  assert.equal(privateHostOutputGate.acceptedGate.admitted, true);
  assert.equal(privateHostOutputGate.acceptedGate.compatibilityClaimed, false);

  for (const gateId of publicCompatibilityGateIds) {
    const gate = checkedManifest.conformanceGates.find(
      (entry) => entry.id === gateId
    );
    assert.equal(gate.acceptedGate.status, "accepted-blocked");
    assert.equal(gate.acceptedGate.admitted, false);
    assert.equal(gate.acceptedGate.compatibilityClaimed, false);
  }

  for (const scenario of checkedManifest.scenarios) {
    assert.deepEqual(scenario.conformanceGateIds, [
      "react-dom-root-private-host-output-gate"
    ]);
    assert.equal(
      scenario.compatibilityStatus,
      "matched-but-compatibility-not-claimed"
    );
    assert.equal(scenario.timingStatus, "diagnostic-only");
    assert.equal(scenario.timingDataPolicy, "diagnostic-until-compatible");
    assert.match(scenario.blockedReason, /public .*compatibility/i);
    assert.match(scenario.blockedReason, /comparable timing remain[s]? blocked/i);
  }

  const diagnosticMilestone = checkedManifest.milestones.find(
    (entry) =>
      entry.id === "private-root-host-output-timing-canaries-diagnostic-admission"
  );
  assert.deepEqual(diagnosticMilestone.scenarioIds, timingCanaryScenarioIds);
  assert.deepEqual(diagnosticMilestone.conformanceGateIds, [
    "react-dom-root-private-host-output-gate"
  ]);
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
      entry.id === "private-root-host-output-public-timing-promotion-blocked"
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

test("private root host-output timing canaries reject claim-capable timing", () => {
  const candidate = clone(manifest);
  candidate.scenarios[0].timingStatus = "improvement";

  const errors = validateBenchmarkManifest(candidate, { repoRoot });

  assert.match(
    errors.join("\n"),
    /timingStatus improvement requires compatibilityStatus green/
  );
});

test("private root host-output timing canaries reject public promotion before green gates", () => {
  const candidate = clone(manifest);
  const milestone = candidate.milestones.find(
    (entry) =>
      entry.id === "private-root-host-output-public-timing-promotion-blocked"
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

test("private root host-output timing canaries reject diagnostic admission through public gates", () => {
  const candidate = clone(manifest);
  candidate.scenarios[0].conformanceGateIds.push(
    "react-dom-root-render-e2e-public-compatibility"
  );

  const errors = validateBenchmarkManifest(candidate, { repoRoot });

  assert.match(
    errors.join("\n"),
    /scenario private-root-host-output-create-mark-listen-timing-canary: diagnostic private admission requires react-dom-root-render-e2e-public-compatibility acceptedGate.status=accepted-private-partial, admitted=true, and compatibilityClaimed=false/
  );
});

test("private root host-output timing result artifacts cannot become comparable", () => {
  const result = {
    schemaVersion: 1,
    kind: "fast-react-benchmark-result",
    manifestId: manifest.manifestId,
    generatedTimestampIncluded: false,
    scenarioResults: [
      {
        scenarioId: "private-root-host-output-initial-render-timing-canary",
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
    /result scenario private-root-host-output-initial-render-timing-canary: timingStatus comparable requires compatibilityStatus green/
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
