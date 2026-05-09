import { readFileSync } from "node:fs";

import {
  REACT_DOM_ROOT_RENDER_E2E_ORACLE_ARTIFACT_PATH
} from "./react-dom-root-render-e2e-targets.mjs";

export function stringifyReactDomRootRenderE2EOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactDomRootRenderE2EOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(readCheckedReactDomRootRenderE2EOracleText(baseUrl));
}

export function readCheckedReactDomRootRenderE2EOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${REACT_DOM_ROOT_RENDER_E2E_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatReactDomRootRenderE2EOracleAsMarkdown(oracle) {
  const observationLines = oracle.probeModes.map((mode) => {
    const observations = oracle.reactDomObservations[mode.id] ?? [];
    return `- ${mode.id}: ${observations.length} root render e2e scenarios`;
  });

  const scenarioLines = oracle.scenarios.map(
    (scenario) => `- ${scenario.id}: ${scenario.area}`
  );

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React React DOM Root Render E2E Oracle",
    "",
    "Generated from pinned React DOM 19.2.6 package artifacts. This artifact captures createRoot, root.render, update, render-null, unmount, and focused warning/error behavior under a deterministic DOM shim.",
    "",
    "Fast React compatibility remains explicitly unclaimed.",
    "",
    "## Observations",
    "",
    ...observationLines,
    "",
    "## Scenarios",
    "",
    ...scenarioLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findReactDomRootRenderE2EObservation(
  oracle,
  modeId,
  packageName,
  scenarioId
) {
  const observations =
    packageName === oracle.fastReactTarget?.packageName
      ? oracle.fastReactObservations[modeId]
      : oracle.reactDomObservations[modeId];
  const observation = observations?.find(
    (candidate) =>
      candidate.packageName === packageName && candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing React DOM root render e2e observation: ${modeId}:${packageName}:${scenarioId}`
    );
  }
  return observation;
}
