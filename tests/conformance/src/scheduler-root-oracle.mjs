import { readFileSync } from "node:fs";

import { SCHEDULER_ROOT_ORACLE_ARTIFACT_PATH } from "./scheduler-root-targets.mjs";

export function stringifySchedulerRootOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedSchedulerRootOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedSchedulerRootOracleText(baseUrl));
}

export function readCheckedSchedulerRootOracleText(baseUrl = import.meta.url) {
  return readFileSync(
    new URL(`../${SCHEDULER_ROOT_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatSchedulerRootOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.area}; entrypoints: ${scenario.entrypoints.join(", ")}`
  );

  const modeLines = oracle.probeModes.map((mode) => {
    const observationCount = oracle.schedulerObservations[mode.id]?.length ?? 0;
    return `- ${mode.id}: ${observationCount} scheduler observations`;
  });

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  const caveatLines = oracle.timingCaveats.map((caveat) => `- ${caveat}`);

  return [
    "# Scheduler Root Oracle",
    "",
    "Generated from the exact scheduler 0.27.0 npm artifact. This oracle records normalized public root behavior and does not claim Fast React scheduler compatibility.",
    "",
    "## Scenarios",
    "",
    ...scenarioLines,
    "",
    "## Probe Modes",
    "",
    ...modeLines,
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

export function findSchedulerRootObservation(oracle, modeId, scenarioId) {
  const observation = oracle.schedulerObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(`Missing scheduler root observation: ${modeId}:${scenarioId}`);
  }
  return observation;
}
