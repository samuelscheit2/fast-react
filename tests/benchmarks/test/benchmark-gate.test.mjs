import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
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

test("checked benchmark manifests pass the fail-closed gate", () => {
  const result = assertBenchmarkGate({ benchmarkRoot, repoRoot });

  assert.equal(result.manifestCount, 3);
  assert.equal(result.scenarioCount, 40);
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
  assert.deepEqual(CLAIM_CAPABLE_TIMING_STATUSES, [
    "comparable",
    "noise-bound",
    "regression",
    "improvement"
  ]);

  for (const manifest of result.manifests) {
    for (const scenario of manifest.scenarios) {
      assert.equal(scenario.compatibilityStatus, "blocked-by-conformance");
      assert.equal(scenario.timingStatus, "blocked-by-conformance");
      assert.equal(scenario.timingDataPolicy, "diagnostic-until-compatible");
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
