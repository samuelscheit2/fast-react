import { readFileSync } from "node:fs";

import { SCHEDULER_MOCK_ORACLE_ARTIFACT_PATH } from "./scheduler-mock-targets.mjs";

export function stringifySchedulerMockOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedSchedulerMockOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedSchedulerMockOracleText(baseUrl));
}

export function readCheckedSchedulerMockOracleText(baseUrl = import.meta.url) {
  return readFileSync(
    new URL(`../${SCHEDULER_MOCK_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatSchedulerMockOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.area}; entrypoints: ${scenario.entrypoints.join(", ")}`
  );

  const modeLines = oracle.probeModes.map((mode) => {
    const schedulerCount = oracle.schedulerObservations[mode.id]?.length ?? 0;
    const fastReactStatuses = countStatuses(
      oracle.fastReactComparisons[mode.id] ?? []
    );

    return `- ${mode.id}: ${schedulerCount} scheduler observations; Fast React comparisons ${JSON.stringify(fastReactStatuses)}`;
  });

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  const riskLines = oracle.implementationRisks.map((risk) => `- ${risk}`);

  return [
    "# Scheduler Mock Oracle",
    "",
    "Generated from exact scheduler@0.27.0 artifacts and the current local scheduler implementation. This oracle records deterministic scheduler/unstable_mock behavior and keeps broad Fast React compatibility claims false.",
    "",
    "## Scenarios",
    "",
    ...scenarioLines,
    "",
    "## Probe Modes",
    "",
    ...modeLines,
    "",
    "## Implementation Risks",
    "",
    ...riskLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findSchedulerMockObservation(oracle, modeId, scenarioId) {
  const observation = oracle.schedulerObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(`Missing scheduler mock observation: ${modeId}:${scenarioId}`);
  }
  return observation;
}

export function findFastReactSchedulerMockObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.fastReactObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing Fast React scheduler mock observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findFastReactSchedulerMockComparison(
  oracle,
  modeId,
  scenarioId
) {
  const comparison = oracle.fastReactComparisons[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!comparison) {
    throw new Error(
      `Missing Fast React scheduler mock comparison: ${modeId}:${scenarioId}`
    );
  }
  return comparison;
}

function countStatuses(comparisons) {
  const counts = {};
  for (const comparison of comparisons) {
    counts[comparison.status] = (counts[comparison.status] ?? 0) + 1;
  }
  return counts;
}
