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
  "private-root-update-text-event-passive-timing-canaries.json"
);

const timingCanaryScenarioIds = [
  "private-root-update-gate-timing-canary",
  "private-dom-reset-text-content-timing-canary",
  "private-root-event-dispatch-timing-canary",
  "private-passive-flush-gate-timing-canary"
];

const privateGateIds = [
  "react-dom-root-private-update-gate",
  "dom-text-content-private-reset-text-content-gate",
  "react-dom-private-event-dispatch-gate",
  "react-dom-test-utils-private-passive-flush-gate"
];

const publicCompatibilityGateIds = [
  "react-dom-root-render-e2e-public-compatibility",
  "react-dom-root-public-facade-blocked-gate",
  "dom-text-content-public-compatibility",
  "dom-event-delegation-public-compatibility",
  "react-dom-test-utils-act-public-compatibility"
];

const scenarioGatePairs = [
  ["private-root-update-gate-timing-canary", "react-dom-root-private-update-gate"],
  [
    "private-dom-reset-text-content-timing-canary",
    "dom-text-content-private-reset-text-content-gate"
  ],
  [
    "private-root-event-dispatch-timing-canary",
    "react-dom-private-event-dispatch-gate"
  ],
  [
    "private-passive-flush-gate-timing-canary",
    "react-dom-test-utils-private-passive-flush-gate"
  ]
];

test("private root update, text reset, event, and passive timing canaries stay diagnostic-only", () => {
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
    assert.match(scenario.blockedReason, /comparable timing remain[s]? blocked/i);
  }

  const rootUpdateScenario = checkedManifest.scenarios[0];
  assert.match(rootUpdateScenario.blockedReason, /public root update/i);

  const textResetScenario = checkedManifest.scenarios[1];
  assert.match(textResetScenario.blockedReason, /resetTextContent/i);
  assert.match(textResetScenario.blockedReason, /browser DOM mutation/i);

  const eventDispatchScenario = checkedManifest.scenarios[2];
  assert.match(eventDispatchScenario.blockedReason, /currentTarget/i);
  assert.match(eventDispatchScenario.blockedReason, /SyntheticEvent compatibility/i);

  const passiveFlushScenario = checkedManifest.scenarios[3];
  assert.match(passiveFlushScenario.blockedReason, /passive metadata/i);
  assert.match(passiveFlushScenario.blockedReason, /public act compatibility/i);

  const diagnosticMilestone = checkedManifest.milestones.find(
    (entry) =>
      entry.id ===
      "private-root-update-text-event-passive-timing-canaries-diagnostic-admission"
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
      "private-root-update-text-event-passive-public-timing-promotion-blocked"
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

test("private root update, text reset, event, and passive timing canaries reject claim-capable timing", () => {
  const candidate = clone(manifest);
  candidate.scenarios[2].timingStatus = "improvement";

  const errors = validateBenchmarkManifest(candidate, { repoRoot });

  assert.match(
    errors.join("\n"),
    /timingStatus improvement requires compatibilityStatus green/
  );
});

test("private root update, text reset, event, and passive timing canaries reject public promotion before green gates", () => {
  const candidate = clone(manifest);
  const milestone = candidate.milestones.find(
    (entry) =>
      entry.id ===
      "private-root-update-text-event-passive-public-timing-promotion-blocked"
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
    /unsupported green compatibility claim; react-dom-root-public-facade-blocked-gate acceptedGate\.admitted=false/
  );
  assert.match(
    joined,
    /unsupported green compatibility claim; dom-event-delegation-public-compatibility has conformanceClaims\.fullDualRunOracleExists=false/
  );
  assert.match(
    joined,
    /unsupported green compatibility claim; react-dom-test-utils-act-public-compatibility acceptedGate\.compatibilityClaimed=false/
  );
});

test("private event timing canary rejects diagnostic admission through public gates", () => {
  const candidate = clone(manifest);
  candidate.scenarios[2].conformanceGateIds.push(
    "dom-event-delegation-public-compatibility"
  );

  const errors = validateBenchmarkManifest(candidate, { repoRoot });

  assert.match(
    errors.join("\n"),
    /scenario private-root-event-dispatch-timing-canary: diagnostic private admission requires dom-event-delegation-public-compatibility acceptedGate.status=accepted-private-partial, admitted=true, and compatibilityClaimed=false/
  );
});

test("private passive timing result artifacts cannot become comparable", () => {
  const result = {
    schemaVersion: 1,
    kind: "fast-react-benchmark-result",
    manifestId: manifest.manifestId,
    generatedTimestampIncluded: false,
    scenarioResults: [
      {
        scenarioId: "private-passive-flush-gate-timing-canary",
        implementation: "fast-react-private-passive-flush-gate",
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
    /result scenario private-passive-flush-gate-timing-canary: timingStatus comparable requires compatibilityStatus green/
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
