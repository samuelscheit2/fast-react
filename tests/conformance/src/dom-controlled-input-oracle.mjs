import { readFileSync } from "node:fs";

import { DOM_CONTROLLED_INPUT_ORACLE_ARTIFACT_PATH } from "./dom-controlled-input-targets.mjs";

export function stringifyDomControlledInputOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedDomControlledInputOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedDomControlledInputOracleText(baseUrl));
}

export function readCheckedDomControlledInputOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${DOM_CONTROLLED_INPUT_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatDomControlledInputOracleAsMarkdown(oracle) {
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
    const observations = oracle.clientFormStateObservations[mode.id] ?? [];
    const phaseCount = observations.reduce(
      (count, observation) => count + observation.result.phases.length,
      0
    );
    return `- ${mode.id}: ${observations.length} scenarios, ${phaseCount} client form-state phases`;
  });

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React DOM Controlled Input Oracle",
    "",
    "Generated from pinned React DOM 19.2.6 package artifacts. Server serialization uses react-dom/server; client probes execute real React DOM client code against a deterministic fake DOM substrate focused on input, select, option, and textarea form state. This artifact does not claim Fast React behavior compatibility.",
    "",
    "## Scenarios",
    "",
    ...scenarioLines,
    "",
    "## Server Serialization",
    "",
    ...serverLines,
    "",
    "## Client Form State",
    "",
    ...clientLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findDomControlledInputServerObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.serverSerializationObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing DOM controlled input server observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findDomControlledInputClientObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.clientFormStateObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing DOM controlled input client observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findDomControlledInputPhase(observation, phaseId) {
  const phase = observation.result.phases.find(
    (candidate) => candidate.phaseId === phaseId
  );
  if (!phase) {
    throw new Error(
      `Missing DOM controlled input phase: ${observation.scenarioId}:${phaseId}`
    );
  }
  return phase;
}
