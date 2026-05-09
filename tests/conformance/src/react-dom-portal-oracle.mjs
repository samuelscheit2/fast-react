import { readFileSync } from "node:fs";

import { REACT_DOM_PORTAL_ORACLE_ARTIFACT_PATH } from "./react-dom-portal-targets.mjs";

export function stringifyReactDomPortalOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactDomPortalOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedReactDomPortalOracleText(baseUrl));
}

export function readCheckedReactDomPortalOracleText(baseUrl = import.meta.url) {
  return readFileSync(
    new URL(`../${REACT_DOM_PORTAL_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatReactDomPortalOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.area}; entrypoints: ${scenario.entrypoints.join(", ")}`
  );

  const modeLines = oracle.probeModes.map((mode) => {
    const observations = oracle.portalBehaviorObservations[mode.id] ?? [];
    const okCount = observations.filter(
      (observation) => observation.result.result.status === "ok"
    ).length;
    const throwCount = observations.filter(
      (observation) => observation.result.result.status === "throws"
    ).length;
    return `- ${mode.id}: ${observations.length} portal observations, ${okCount} scenario roots ok, ${throwCount} scenario roots threw`;
  });

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React React DOM Portal Oracle",
    "",
    "Generated from pinned React DOM 19.2.6 package artifacts and the checked runtime inventory. This artifact captures createPortal public object-construction behavior only and does not claim Fast React behavior compatibility.",
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

export function findReactDomPortalObservation(oracle, modeId, scenarioId) {
  const observation = oracle.portalBehaviorObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(`Missing React DOM portal observation: ${modeId}:${scenarioId}`);
  }
  return observation;
}
