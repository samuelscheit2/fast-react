import { readFileSync } from "node:fs";

import { REACT_DOM_FORM_ACTIONS_ORACLE_ARTIFACT_PATH } from "./react-dom-form-actions-targets.mjs";

export function stringifyReactDomFormActionsOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactDomFormActionsOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedReactDomFormActionsOracleText(baseUrl));
}

export function readCheckedReactDomFormActionsOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${REACT_DOM_FORM_ACTIONS_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatReactDomFormActionsOracleAsMarkdown(oracle) {
  const modeLines = oracle.probeModes.map((mode) => {
    const observations = oracle.observations[mode.id] ?? [];
    const ok = observations.filter(
      (observation) => observation.result.status === "ok"
    ).length;
    const throwing = observations.filter(
      (observation) => observation.result.status === "throws"
    ).length;
    return `- ${mode.id}: ${observations.length} scenarios, ${ok} top-level ok, ${throwing} top-level threw`;
  });

  const scenarioLines = oracle.scenarios.map(
    (scenario) => `- ${scenario.id}: ${scenario.area}`
  );

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React React DOM Form Actions Oracle",
    "",
    "Generated from pinned React DOM 19.2.6 package artifacts. This artifact captures public form API errors, hook boundaries, server-render observable return shapes, and DOM/form dependency edges without claiming full client form-action compatibility.",
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

export function findReactDomFormActionsObservation(oracle, modeId, scenarioId) {
  const observation = oracle.observations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing React DOM form-actions observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}
