import { readFileSync } from "node:fs";

import { DOM_ATTRIBUTE_PROPERTY_ORACLE_ARTIFACT_PATH } from "./dom-attribute-property-targets.mjs";

export function stringifyDomAttributePropertyOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedDomAttributePropertyOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(readCheckedDomAttributePropertyOracleText(baseUrl));
}

export function readCheckedDomAttributePropertyOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${DOM_ATTRIBUTE_PROPERTY_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatDomAttributePropertyOracleAsMarkdown(oracle) {
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
    "# Fast React DOM Attribute/Property Oracle",
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

export function findDomAttributePropertyServerObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.serverSerializationObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing DOM attribute/property server observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findDomAttributePropertyClientObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.clientMutationObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing DOM attribute/property client observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findDomAttributePropertyPhase(observation, phaseId) {
  const phase = observation.result.phases.find(
    (candidate) => candidate.phaseId === phaseId
  );
  if (!phase) {
    throw new Error(
      `Missing DOM attribute/property phase: ${observation.scenarioId}:${phaseId}`
    );
  }
  return phase;
}
