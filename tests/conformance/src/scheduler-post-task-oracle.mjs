import { readFileSync } from "node:fs";

import { SCHEDULER_POST_TASK_ORACLE_ARTIFACT_PATH } from "./scheduler-post-task-targets.mjs";

export function stringifySchedulerPostTaskOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedSchedulerPostTaskOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedSchedulerPostTaskOracleText(baseUrl));
}

export function readCheckedSchedulerPostTaskOracleText(baseUrl = import.meta.url) {
  return readFileSync(
    new URL(`../${SCHEDULER_POST_TASK_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatSchedulerPostTaskOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.area}; entrypoints: ${scenario.entrypoints.join(", ")}`
  );

  const modeLines = oracle.probeModes.map((mode) => {
    const observationCount = oracle.schedulerObservations[mode.id]?.length ?? 0;
    return `- ${mode.id}: ${observationCount} scheduler observations`;
  });

  const coverageLines = Object.entries(oracle.coverage).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  const caveatLines = oracle.timingCaveats.map((caveat) => `- ${caveat}`);

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Scheduler Post Task Oracle",
    "",
    "Generated from the exact scheduler 0.27.0 npm artifact. This oracle records normalized scheduler/unstable_post_task behavior under plain Node and controlled Task Scheduling API shims; it does not claim Fast React scheduler compatibility.",
    "",
    "## Scenarios",
    "",
    ...scenarioLines,
    "",
    "## Probe Modes",
    "",
    ...modeLines,
    "",
    "## Coverage",
    "",
    ...coverageLines,
    "",
    "## Timing Caveats",
    "",
    ...caveatLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findSchedulerPostTaskObservation(oracle, modeId, scenarioId) {
  const observation = oracle.schedulerObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing scheduler post-task observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}
