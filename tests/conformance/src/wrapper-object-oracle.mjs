import { readFileSync } from "node:fs";

import { WRAPPER_OBJECT_ORACLE_ARTIFACT_PATH } from "./wrapper-object-targets.mjs";

export function stringifyWrapperObjectOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedWrapperObjectOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedWrapperObjectOracleText(baseUrl));
}

export function readCheckedWrapperObjectOracleText(baseUrl = import.meta.url) {
  return readFileSync(
    new URL(`../${WRAPPER_OBJECT_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatWrapperObjectOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.area}; entrypoints: ${scenario.entrypoints.join(", ")}`
  );

  const modeLines = oracle.probeModes.map((mode) => {
    const reactCount = oracle.reactObservations[mode.id]?.length ?? 0;
    const fastCount = oracle.fastReactObservations[mode.id]?.length ?? 0;
    const comparisonStatuses = new Set(
      (oracle.fastReactComparisons[mode.id] ?? []).map(
        (comparison) => comparison.status
      )
    );
    return `- ${mode.id}: ${reactCount} React observations, ${fastCount} Fast React observations, comparison statuses: ${[...comparisonStatuses].join(", ")}`;
  });

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React Wrapper Object Oracle",
    "",
    "Generated from exact React 19.2.6 artifacts with local Fast React memo/lazy wrapper-object comparisons. This artifact does not claim Fast React behavior compatibility.",
    "",
    "## Scenarios",
    "",
    ...scenarioLines,
    "",
    "## Probe Modes",
    "",
    ...modeLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findWrapperObjectObservation(
  oracle,
  modeId,
  packageName,
  scenarioId
) {
  const collection =
    packageName === oracle.reactTarget.packageName
      ? oracle.reactObservations
      : oracle.fastReactObservations;
  const observation = collection[modeId]?.find(
    (candidate) =>
      candidate.packageName === packageName && candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing wrapper-object observation: ${modeId}:${packageName}:${scenarioId}`
    );
  }
  return observation;
}
