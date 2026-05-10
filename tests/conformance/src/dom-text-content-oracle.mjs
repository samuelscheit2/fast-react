import { readFileSync } from "node:fs";

import { DOM_TEXT_CONTENT_ORACLE_ARTIFACT_PATH } from "./dom-text-content-targets.mjs";

export function stringifyDomTextContentOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedDomTextContentOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedDomTextContentOracleText(baseUrl));
}

export function readCheckedDomTextContentOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${DOM_TEXT_CONTENT_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatDomTextContentOracleAsMarkdown(oracle) {
  const shouldSetLines = oracle.shouldSetTextContentScenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.coverage.join(", ")}; expected: ${scenario.expectedReactDomValue}`
  );

  const renderScenarioLines = oracle.renderScenarios.map(
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
    "# Fast React DOM Text Content Oracle",
    "",
    "Generated from pinned React DOM 19.2.6 package artifacts. shouldSetTextContent is evaluated from the extracted React DOM client development bundle; server serialization uses react-dom/server; client mutation probes execute real React DOM client code against a deterministic fake DOM substrate. This artifact does not claim Fast React behavior compatibility.",
    "",
    "## shouldSetTextContent",
    "",
    ...shouldSetLines,
    "",
    "## Render Scenarios",
    "",
    ...renderScenarioLines,
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

export function findDomTextContentShouldSetObservation(oracle, scenarioId) {
  const observation = oracle.shouldSetTextContentObservations.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing DOM text-content shouldSetTextContent observation: ${scenarioId}`
    );
  }
  return observation;
}

export function findDomTextContentServerObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.serverSerializationObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing DOM text-content server observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findDomTextContentClientObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.clientMutationObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing DOM text-content client observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findDomTextContentPhase(observation, phaseId) {
  const phase = observation.result.phases.find(
    (candidate) => candidate.phaseId === phaseId
  );
  if (!phase) {
    throw new Error(
      `Missing DOM text-content phase: ${observation.scenarioId}:${phaseId}`
    );
  }
  return phase;
}
