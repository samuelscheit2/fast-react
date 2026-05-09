import { readFileSync } from "node:fs";

import {
  REACT_DOM_SERVER_STATIC_ORACLE_ARTIFACT_PATH
} from "./react-dom-server-static-targets.mjs";

export function stringifyReactDomServerStaticOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactDomServerStaticOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(readCheckedReactDomServerStaticOracleText(baseUrl));
}

export function readCheckedReactDomServerStaticOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${REACT_DOM_SERVER_STATIC_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatReactDomServerStaticOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.area}; entrypoints: ${scenario.entrypoints.join(", ")}`
  );

  const modeLines = oracle.probeModes.map((mode) => {
    const reactCount = oracle.reactDomObservations[mode.id]?.length ?? 0;
    const fastCount = oracle.fastReactDomObservations[mode.id]?.length ?? 0;
    const comparisonStatuses = new Set(
      (oracle.fastReactDomComparisons[mode.id] ?? []).map(
        (comparison) => comparison.status
      )
    );
    return `- ${mode.id}: ${reactCount} React DOM observations, ${fastCount} Fast React DOM observations, comparison statuses: ${[...comparisonStatuses].join(", ")}`;
  });

  const deferredLines = oracle.deferredFizzBehavior.map(
    (item) => `- ${item.id}: ${item.reason}`
  );

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React React DOM Server/Static Oracle",
    "",
    "Generated from exact React DOM 19.2.6 artifacts with local Fast React React DOM server/static placeholder comparisons. This artifact records behavior evidence and unsupported boundaries; it does not claim Fast React DOM server compatibility.",
    "",
    "## Scenarios",
    "",
    ...scenarioLines,
    "",
    "## Probe Modes",
    "",
    ...modeLines,
    "",
    "## Deferred Fizz Behavior",
    "",
    ...deferredLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findReactDomServerStaticObservation(
  oracle,
  modeId,
  packageName,
  scenarioId
) {
  const collection =
    packageName === oracle.reactDomTarget.packageName
      ? oracle.reactDomObservations
      : oracle.fastReactDomObservations;
  const observation = collection[modeId]?.find(
    (candidate) =>
      candidate.packageName === packageName && candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing React DOM server/static observation: ${modeId}:${packageName}:${scenarioId}`
    );
  }
  return observation;
}

export function findReactDomServerStaticComparison(
  oracle,
  modeId,
  scenarioId
) {
  const comparison = oracle.fastReactDomComparisons[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!comparison) {
    throw new Error(
      `Missing React DOM server/static comparison: ${modeId}:${scenarioId}`
    );
  }
  return comparison;
}
