import { readFileSync } from "node:fs";

import { REACT_TEST_RENDERER_ERROR_SURFACE_ORACLE_ARTIFACT_PATH } from "./react-test-renderer-error-surface-targets.mjs";

export function stringifyReactTestRendererErrorSurfaceOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactTestRendererErrorSurfaceOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(
    readCheckedReactTestRendererErrorSurfaceOracleText(baseUrl)
  );
}

export function readCheckedReactTestRendererErrorSurfaceOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(
      `../${REACT_TEST_RENDERER_ERROR_SURFACE_ORACLE_ARTIFACT_PATH}`,
      baseUrl
    ),
    "utf8"
  );
}

export function formatReactTestRendererErrorSurfaceOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.area}; entrypoints: ${scenario.entrypoints.join(", ")}`
  );

  const modeLines = oracle.probeModes.map((mode) => {
    const observations =
      oracle.reactTestRendererErrorSurfaceObservations[mode.id] ?? [];
    const okCount = observations.filter(
      (observation) => observation.result.result.status === "ok"
    ).length;
    const throwCount = observations.filter(
      (observation) => observation.result.result.status === "throws"
    ).length;
    return `- ${mode.id}: ${observations.length} scenario roots, ${okCount} ok, ${throwCount} threw`;
  });

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React React Test Renderer Error Surface Oracle",
    "",
    "Generated from pinned React 19.2.6 and react-test-renderer 19.2.6 package artifacts. This artifact captures public error messages only and does not claim Fast React behavior compatibility.",
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

export function findReactTestRendererErrorSurfaceObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation =
    oracle.reactTestRendererErrorSurfaceObservations[modeId]?.find(
      (candidate) => candidate.scenarioId === scenarioId
    );
  if (!observation) {
    throw new Error(
      `Missing React test renderer error surface observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}
