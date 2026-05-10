#!/usr/bin/env node

import { assertBenchmarkGate } from "../src/benchmark-gate.mjs";

try {
  const result = assertBenchmarkGate();
  console.log(
    `Benchmark manifest gate passed: ${result.manifestCount} manifests, ${result.scenarioCount} scenarios, ${result.milestoneCount} milestones, ${result.resultCount} result artifacts.`
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
