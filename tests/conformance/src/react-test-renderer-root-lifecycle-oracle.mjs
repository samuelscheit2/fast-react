import { readFileSync } from "node:fs";

import { REACT_TEST_RENDERER_ROOT_LIFECYCLE_ORACLE_ARTIFACT_PATH } from "./react-test-renderer-root-lifecycle-targets.mjs";

export function stringifyReactTestRendererRootLifecycleOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactTestRendererRootLifecycleOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(readCheckedReactTestRendererRootLifecycleOracleText(baseUrl));
}

export function readCheckedReactTestRendererRootLifecycleOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(
      `../${REACT_TEST_RENDERER_ROOT_LIFECYCLE_ORACLE_ARTIFACT_PATH}`,
      baseUrl
    ),
    "utf8"
  );
}

export function formatReactTestRendererRootLifecycleOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.area}; entrypoints: ${scenario.entrypoints.join(", ")}`
  );

  const modeLines = oracle.probeModes.map((mode) => {
    const observations =
      oracle.rootLifecycleObservations[mode.id] ?? [];
    const okCount = observations.filter(
      (observation) => observation.result.status === "ok"
    ).length;
    const throwCount = observations.filter(
      (observation) => observation.result.status === "throws"
    ).length;
    return `- ${mode.id}: ${observations.length} root-lifecycle observations, ${okCount} scenario roots ok, ${throwCount} scenario roots threw`;
  });

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# React Test Renderer Root Lifecycle Oracle",
    "",
    "Generated from exact React 19.2.6 and react-test-renderer 19.2.6 package artifacts. This oracle records create, update, unmount, .root, getInstance, createNodeMock, and root-option behavior without claiming Fast React compatibility.",
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

export function findReactTestRendererRootLifecycleObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.rootLifecycleObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing React test renderer root lifecycle observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}
