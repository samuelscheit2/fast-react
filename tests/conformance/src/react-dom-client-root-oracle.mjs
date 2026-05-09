import { readFileSync } from "node:fs";

import {
  REACT_DOM_CLIENT_ROOT_ORACLE_ARTIFACT_PATH
} from "./react-dom-client-root-targets.mjs";

export function stringifyReactDomClientRootOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactDomClientRootOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedReactDomClientRootOracleText(baseUrl));
}

export function readCheckedReactDomClientRootOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${REACT_DOM_CLIENT_ROOT_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatReactDomClientRootOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.area}; entrypoints: ${scenario.entrypoints.join(", ")}`
  );

  const modeLines = oracle.probeModes.map((mode) => {
    const reactCount = oracle.reactDomObservations[mode.id]?.length ?? 0;
    const fastCount = oracle.fastReactObservations[mode.id]?.length ?? 0;
    const comparisonStatuses = new Set(
      (oracle.fastReactComparisons[mode.id] ?? []).map(
        (comparison) => comparison.status
      )
    );
    return `- ${mode.id}: ${reactCount} React DOM observations, ${fastCount} Fast React observations, comparison statuses: ${[...comparisonStatuses].join(", ")}`;
  });

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React React DOM Client Root Oracle",
    "",
    "Generated from exact React DOM 19.2.6 artifacts with local Fast React placeholder comparisons. This artifact does not claim Fast React React DOM behavior compatibility.",
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

export function findReactDomClientRootObservation(
  oracle,
  modeId,
  packageName,
  scenarioId
) {
  const collection =
    packageName === oracle.reactDomTarget.packageName
      ? oracle.reactDomObservations
      : oracle.fastReactObservations;
  const observation = collection[modeId]?.find(
    (candidate) =>
      candidate.packageName === packageName && candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing React DOM client-root observation: ${modeId}:${packageName}:${scenarioId}`
    );
  }
  return observation;
}
