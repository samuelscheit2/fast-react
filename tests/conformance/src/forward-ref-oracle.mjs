import { readFileSync } from "node:fs";

import { FORWARD_REF_ORACLE_ARTIFACT_PATH } from "./forward-ref-targets.mjs";

export function stringifyForwardRefOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedForwardRefOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedForwardRefOracleText(baseUrl));
}

export function readCheckedForwardRefOracleText(baseUrl = import.meta.url) {
  return readFileSync(
    new URL(`../${FORWARD_REF_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatForwardRefOracleAsMarkdown(oracle) {
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
    "# Fast React Forward Ref Oracle",
    "",
    "Generated from exact React 19.2.6 artifacts with local Fast React forwardRef wrapper-object comparisons. This artifact does not claim Fast React behavior compatibility.",
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

export function findForwardRefObservation(
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
      `Missing forward-ref observation: ${modeId}:${packageName}:${scenarioId}`
    );
  }
  return observation;
}
