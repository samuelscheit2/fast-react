import { readFileSync } from "node:fs";

import { CHILDREN_HELPER_ORACLE_ARTIFACT_PATH } from "./children-helper-targets.mjs";

export function stringifyChildrenHelperOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedChildrenHelperOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedChildrenHelperOracleText(baseUrl));
}

export function readCheckedChildrenHelperOracleText(baseUrl = import.meta.url) {
  return readFileSync(
    new URL(`../${CHILDREN_HELPER_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatChildrenHelperOracleAsMarkdown(oracle) {
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
    "# Fast React Children Helper Oracle",
    "",
    "Generated from exact React 19.2.6 artifacts with local Fast React Children helper comparisons. This artifact does not claim Fast React behavior compatibility.",
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

export function findChildrenHelperObservation(
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
      `Missing children-helper observation: ${modeId}:${packageName}:${scenarioId}`
    );
  }
  return observation;
}
