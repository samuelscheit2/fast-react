import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ACCEPTED_GATE_STATUSES,
  BENCHMARK_READINESS_STATUSES,
  CLAIM_CAPABLE_TIMING_STATUSES,
  COMPATIBILITY_STATUSES,
  TIMING_STATUSES,
  assertBenchmarkGate,
  validateBenchmarkManifest,
  validateBenchmarkResult
} from "../src/benchmark-gate.mjs";

const benchmarkRoot = path.resolve(
  fileURLToPath(new URL("..", import.meta.url))
);
const repoRoot = path.resolve(benchmarkRoot, "../..");

const rootManifest = readManifest("root-render-dual-run-gate-1.json");
const minimalRootMilestoneManifest = readManifest(
  "minimal-root-lifecycle-milestones.json"
);
const privateDiagnosticManifest = readManifest(
  "private-diagnostic-gate-admissions.json"
);
const privateRootHostOutputTimingManifest = readManifest(
  "private-root-host-output-timing-canaries.json"
);
const privateRootCrossRootWarningTimingManifest = readManifest(
  "private-root-cross-root-warning-timing-canaries.json"
);
const privateRootUpdateTextEventPassiveTimingManifest = readManifest(
  "private-root-update-text-event-passive-timing-canaries.json"
);
const privateBenchmarkManifestIds = new Set([
  privateDiagnosticManifest.manifestId,
  privateRootHostOutputTimingManifest.manifestId,
  privateRootCrossRootWarningTimingManifest.manifestId,
  privateRootUpdateTextEventPassiveTimingManifest.manifestId
]);
const privateRootHostOutputDiagnosticScenarioIds = [
  "private-root-host-output-create-mark-listen-diagnostics",
  "private-root-host-output-initial-render-diagnostics",
  "private-root-host-output-update-render-diagnostics",
  "private-root-host-output-unmount-cleanup-diagnostics"
];

test("checked benchmark manifests pass the fail-closed gate", () => {
  const result = assertBenchmarkGate({ benchmarkRoot, repoRoot });

  assert.equal(result.manifestCount, 8);
  assert.equal(result.scenarioCount, 92);
  assert.equal(result.milestoneCount, 23);
  assert.equal(result.resultCount, 0);
  assert.deepEqual(COMPATIBILITY_STATUSES, [
    "blocked-by-conformance",
    "oracle-only",
    "unsupported-placeholder",
    "known-mismatch",
    "matched-but-compatibility-not-claimed",
    "green"
  ]);
  assert.deepEqual(TIMING_STATUSES, [
    "not-collected",
    "blocked-by-conformance",
    "diagnostic-only",
    "compared-not-compatible",
    "comparable",
    "noise-bound",
    "regression",
    "improvement"
  ]);
  assert.deepEqual(BENCHMARK_READINESS_STATUSES, [
    "blocked-by-conformance",
    "diagnostic-admitted",
    "comparable-admitted"
  ]);
  assert.deepEqual(ACCEPTED_GATE_STATUSES, [
    "accepted-blocked",
    "accepted-private-partial",
    "accepted-oracle-only",
    "green-admitted"
  ]);
  assert.deepEqual(CLAIM_CAPABLE_TIMING_STATUSES, [
    "comparable",
    "noise-bound",
    "regression",
    "improvement"
  ]);

  for (const manifest of result.manifests) {
    const acceptedGates = (manifest.conformanceGates ?? [])
      .map((gate) => gate.acceptedGate)
      .filter(Boolean);
    for (const acceptedGate of acceptedGates) {
      assert.notEqual(acceptedGate.status, "green-admitted");
      assert.equal(acceptedGate.compatibilityClaimed, false);
      if (acceptedGate.status !== "accepted-private-partial") {
        assert.equal(acceptedGate.admitted, false);
      }
    }
    for (const scenario of manifest.scenarios) {
      assert.notEqual(scenario.compatibilityStatus, "green");
      assert.ok(!CLAIM_CAPABLE_TIMING_STATUSES.includes(scenario.timingStatus));
      assert.equal(scenario.timingDataPolicy, "diagnostic-until-compatible");
    }
    for (const milestone of manifest.milestones ?? []) {
      assert.notEqual(milestone.compatibilityStatus, "green");
      assert.ok(!CLAIM_CAPABLE_TIMING_STATUSES.includes(milestone.timingStatus));
      assert.notEqual(milestone.benchmarkReadinessStatus, "comparable-admitted");
    }
  }

  const diagnosticScenarios = result.manifests
    .flatMap((manifest) => manifest.scenarios)
    .filter((scenario) => scenario.timingStatus === "diagnostic-only");
  assert.equal(diagnosticScenarios.length, 27);
  for (const scenario of diagnosticScenarios) {
    assert.equal(
      scenario.compatibilityStatus,
      "matched-but-compatibility-not-claimed"
    );
  }
  assert.deepEqual(
    privateDiagnosticManifest.scenarios
      .filter((scenario) =>
        scenario.conformanceGateIds.includes(
          "react-dom-root-private-host-output-gate"
        )
      )
      .map((scenario) => scenario.id),
    privateRootHostOutputDiagnosticScenarioIds
  );

  const diagnosticMilestones = result.manifests
    .flatMap((manifest) => manifest.milestones ?? [])
    .filter(
      (milestone) =>
        milestone.benchmarkReadinessStatus === "diagnostic-admitted"
    );
  assert.equal(diagnosticMilestones.length, 8);
  for (const milestone of diagnosticMilestones) {
    assert.equal(
      milestone.compatibilityStatus,
      "matched-but-compatibility-not-claimed"
    );
    assert.equal(milestone.timingStatus, "diagnostic-only");
  }

  const acceptedGateStatusCounts = result.manifests
    .flatMap((manifest) => manifest.conformanceGates ?? [])
    .map((gate) => gate.acceptedGate)
    .filter(Boolean)
    .reduce((counts, acceptedGate) => {
      counts[acceptedGate.status] = (counts[acceptedGate.status] ?? 0) + 1;
      return counts;
    }, {});
  assert.deepEqual(acceptedGateStatusCounts, {
    "accepted-blocked": 14,
    "accepted-private-partial": 24,
    "accepted-oracle-only": 5
  });

  const admittedPrivateGateCount = result.manifests
    .flatMap((manifest) => manifest.conformanceGates ?? [])
    .map((gate) => gate.acceptedGate)
    .filter(
      (acceptedGate) =>
        acceptedGate?.status === "accepted-private-partial" &&
        acceptedGate.admitted === true
    ).length;
  assert.equal(admittedPrivateGateCount, 16);
});

test("public benchmark manifests stay blocked despite private diagnostics", () => {
  const result = assertBenchmarkGate({ benchmarkRoot, repoRoot });
  const publicManifests = result.manifests.filter(
    (manifest) => !privateBenchmarkManifestIds.has(manifest.manifestId)
  );

  assert.equal(publicManifests.length, 4);

  for (const manifest of publicManifests) {
    for (const gate of manifest.conformanceGates ?? []) {
      if (gate.acceptedGate) {
        assert.equal(gate.acceptedGate.admitted, false);
        assert.equal(gate.acceptedGate.compatibilityClaimed, false);
      }
    }
    for (const scenario of manifest.scenarios) {
      assert.equal(scenario.compatibilityStatus, "blocked-by-conformance");
      assert.equal(scenario.timingStatus, "blocked-by-conformance");
    }
    for (const milestone of manifest.milestones ?? []) {
      assert.equal(milestone.compatibilityStatus, "blocked-by-conformance");
      assert.equal(milestone.timingStatus, "blocked-by-conformance");
      assert.equal(
        milestone.benchmarkReadinessStatus,
        "blocked-by-conformance"
      );
    }
  }
});

test("benchmark manifest gate rejects missing required scenarios", () => {
  const manifest = clone(rootManifest);
  manifest.requiredScenarioIds.push("missing-root-scenario");

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(errors.join("\n"), /missing required scenario missing-root-scenario/);
});

test("benchmark manifest gate rejects claim-capable timing without green compatibility", () => {
  const manifest = clone(rootManifest);
  manifest.scenarios[0].timingStatus = "improvement";

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /timingStatus improvement requires compatibilityStatus green/
  );
});

test("benchmark manifest gate rejects unknown scenario statuses", () => {
  const manifest = clone(rootManifest);
  manifest.scenarios[0].compatibilityStatus = "locally-fast";
  manifest.scenarios[0].timingStatus = "headline";

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(errors.join("\n"), /unknown compatibilityStatus locally-fast/);
  assert.match(errors.join("\n"), /unknown timingStatus headline/);
});

test("benchmark manifest gate rejects unsupported green compatibility claims", () => {
  const manifest = clone(rootManifest);
  manifest.scenarios[0].compatibilityStatus = "green";
  manifest.scenarios[0].timingStatus = "diagnostic-only";

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /unsupported green compatibility claim; react-dom-root-render-e2e has conformanceClaims\.compatibilityClaimed=false/
  );
  assert.match(
    errors.join("\n"),
    /unsupported green compatibility claim; react-dom-root-render-e2e acceptedGate\.admitted=false/
  );
});

test("benchmark milestone gate rejects unknown readiness statuses", () => {
  const manifest = clone(minimalRootMilestoneManifest);
  manifest.milestones[0].benchmarkReadinessStatus = "runtime-faster";

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /unknown benchmarkReadinessStatus runtime-faster/
  );
});

test("benchmark milestone gate rejects comparable admission without green compatibility", () => {
  const manifest = clone(minimalRootMilestoneManifest);
  manifest.milestones[0].benchmarkReadinessStatus = "comparable-admitted";

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /benchmarkReadinessStatus comparable-admitted requires compatibilityStatus green/
  );
});

test("benchmark milestone gate rejects diagnostic admission without private gate proof", () => {
  const manifest = clone(minimalRootMilestoneManifest);
  manifest.milestones[0].benchmarkReadinessStatus = "diagnostic-admitted";
  manifest.milestones[0].compatibilityStatus =
    "matched-but-compatibility-not-claimed";
  manifest.milestones[0].timingStatus = "diagnostic-only";

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /diagnostic private admission requires react-dom-client-root acceptedGate.status=accepted-private-partial, admitted=true, and compatibilityClaimed=false/
  );
});

test("benchmark scenario gate admits proven private diagnostics", () => {
  const manifest = clone(privateDiagnosticManifest);

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.deepEqual(errors, []);
});

test("benchmark scenario gate rejects diagnostic timing without private admission", () => {
  const manifest = clone(privateDiagnosticManifest);
  manifest.conformanceGates[0].acceptedGate.admitted = false;

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /scenario private-root-bridge-request-records: diagnostic private admission requires react-dom-root-private-bridge-request-gate acceptedGate.status=accepted-private-partial, admitted=true, and compatibilityClaimed=false/
  );
});

test("benchmark scenario gate rejects private host-output diagnostics without admitted gate", () => {
  const manifest = clone(privateDiagnosticManifest);
  const hostOutputGate = manifest.conformanceGates.find(
    (gate) => gate.id === "react-dom-root-private-host-output-gate"
  );
  hostOutputGate.acceptedGate.admitted = false;

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /scenario private-root-host-output-initial-render-diagnostics: diagnostic private admission requires react-dom-root-private-host-output-gate acceptedGate.status=accepted-private-partial, admitted=true, and compatibilityClaimed=false/
  );
});

test("benchmark accepted gates reject private admission compatibility claims", () => {
  const manifest = clone(privateDiagnosticManifest);
  manifest.conformanceGates[0].acceptedGate.compatibilityClaimed = true;

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /accepted-private-partial requires compatibilityClaimed=false/
  );
});

test("benchmark accepted gates reject blocked metadata carrying admission claims", () => {
  const manifest = clone(minimalRootMilestoneManifest);
  manifest.conformanceGates[0].acceptedGate.admitted = true;

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /accepted-blocked requires admitted=false and compatibilityClaimed=false/
  );
});

test("benchmark milestone gate rejects unknown covered scenarios", () => {
  const manifest = clone(minimalRootMilestoneManifest);
  manifest.milestones[0].scenarioIds.push("missing-root-milestone-scenario");

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /unknown scenario missing-root-milestone-scenario/
  );
});

test("benchmark result gate rejects green timing for blocked scenarios", () => {
  const result = {
    schemaVersion: 1,
    kind: "fast-react-benchmark-result",
    manifestId: rootManifest.manifestId,
    generatedTimestampIncluded: false,
    scenarioResults: [
      {
        scenarioId: "initial-host-render",
        implementation: "fast-react-js-dev",
        lane: "default-node-development",
        timingStatus: "comparable"
      }
    ]
  };

  const errors = validateBenchmarkResult(result, {
    manifestById: new Map([[rootManifest.manifestId, rootManifest]])
  });

  assert.match(
    errors.join("\n"),
    /result scenario initial-host-render: timingStatus comparable requires compatibilityStatus green/
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
