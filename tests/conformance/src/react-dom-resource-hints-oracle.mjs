import { readFileSync } from "node:fs";

import { REACT_DOM_RESOURCE_HINT_ORACLE_ARTIFACT_PATH } from "./react-dom-resource-hints-targets.mjs";

export function stringifyReactDomResourceHintsOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactDomResourceHintsOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(readCheckedReactDomResourceHintsOracleText(baseUrl));
}

export function readCheckedReactDomResourceHintsOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${REACT_DOM_RESOURCE_HINT_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatReactDomResourceHintsOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.area}; ${scenario.observationKind}`
  );
  const modeLines = oracle.probeModes.map((mode) => {
    const observations = oracle.observations[mode.id] ?? [];
    const ok = observations.filter(
      (observation) => observation.result.status === "ok"
    ).length;
    const threw = observations.filter(
      (observation) => observation.result.status === "throws"
    ).length;
    return `- ${mode.id}: ${ok} scenarios completed, ${threw} scenarios threw`;
  });
  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React React DOM Resource Hints Oracle",
    "",
    "Generated from pinned React DOM 19.2.6 package artifacts and the checked runtime inventory. Public API observations and private dispatcher normalization evidence are intentionally separated.",
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

export function findReactDomResourceHintObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.observations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing React DOM resource hint observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}
