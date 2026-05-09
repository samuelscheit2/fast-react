import { readFileSync } from "node:fs";

import { REACT_TEST_RENDERER_SERIALIZATION_ORACLE_ARTIFACT_PATH } from "./react-test-renderer-serialization-targets.mjs";

export function stringifyReactTestRendererSerializationOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactTestRendererSerializationOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(
    readCheckedReactTestRendererSerializationOracleText(baseUrl)
  );
}

export function readCheckedReactTestRendererSerializationOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(
      `../${REACT_TEST_RENDERER_SERIALIZATION_ORACLE_ARTIFACT_PATH}`,
      baseUrl
    ),
    "utf8"
  );
}

export function formatReactTestRendererSerializationOracleAsMarkdown(oracle) {
  const observationLines = oracle.probeModes.map((mode) => {
    const observations = oracle.observations[mode.id] ?? [];
    return `- ${mode.id}: ${observations.length} observations using ${mode.mountStrategy}`;
  });

  const coverageLines = Object.entries(oracle.coverage).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React React Test Renderer Serialization Oracle",
    "",
    "Generated from pinned React 19.2.6, react-test-renderer 19.2.6, and scheduler 0.27.0 package tarballs. This artifact captures public toJSON, toTree, and TestInstance serialization/query behavior without claiming Fast React compatibility.",
    "",
    "## Observations",
    "",
    ...observationLines,
    "",
    "## Coverage",
    "",
    ...coverageLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findReactTestRendererSerializationObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.observations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing react-test-renderer serialization observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}
