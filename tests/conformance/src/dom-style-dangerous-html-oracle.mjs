import { readFileSync } from "node:fs";

import { DOM_STYLE_DANGEROUS_HTML_ORACLE_ARTIFACT_PATH } from "./dom-style-dangerous-html-targets.mjs";

export function stringifyDomStyleDangerousHtmlOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedDomStyleDangerousHtmlOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(readCheckedDomStyleDangerousHtmlOracleText(baseUrl));
}

export function readCheckedDomStyleDangerousHtmlOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${DOM_STYLE_DANGEROUS_HTML_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatDomStyleDangerousHtmlOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.coverage.join(", ")}; phases: ${scenario.phases.length}`
  );

  const serverLines = oracle.probeModes.map((mode) => {
    const observations = oracle.serverSerializationObservations[mode.id] ?? [];
    const phaseCount = observations.reduce(
      (count, observation) => count + observation.result.phases.length,
      0
    );
    return `- ${mode.id}: ${observations.length} scenarios, ${phaseCount} server serialization phases`;
  });

  const clientLines = oracle.probeModes.map((mode) => {
    const observations = oracle.clientMutationObservations[mode.id] ?? [];
    const phaseCount = observations.reduce(
      (count, observation) => count + observation.result.phases.length,
      0
    );
    return `- ${mode.id}: ${observations.length} scenarios, ${phaseCount} client mutation phases`;
  });

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React DOM Style And DangerouslySetInnerHTML Oracle",
    "",
    "Generated from pinned React DOM 19.2.6 package artifacts. Server serialization uses react-dom/server; client mutation probes execute real React DOM client code against a deterministic fake DOM substrate. This artifact does not claim Fast React behavior compatibility.",
    "",
    "## Scenarios",
    "",
    ...scenarioLines,
    "",
    "## Server Serialization",
    "",
    ...serverLines,
    "",
    "## Client Mutation",
    "",
    ...clientLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findDomStyleDangerousHtmlServerObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.serverSerializationObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing DOM style/dangerouslySetInnerHTML server observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findDomStyleDangerousHtmlClientObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.clientMutationObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing DOM style/dangerouslySetInnerHTML client observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findDomStyleDangerousHtmlPhase(observation, phaseId) {
  const phase = observation.result.phases.find(
    (candidate) => candidate.phaseId === phaseId
  );
  if (!phase) {
    throw new Error(
      `Missing DOM style/dangerouslySetInnerHTML phase: ${observation.scenarioId}:${phaseId}`
    );
  }
  return phase;
}
