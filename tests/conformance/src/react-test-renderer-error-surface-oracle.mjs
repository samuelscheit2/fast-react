import { readFileSync } from "node:fs";

import { REACT_TEST_RENDERER_ERROR_SURFACE_ORACLE_ARTIFACT_PATH } from "./react-test-renderer-error-surface-targets.mjs";

export const REACT_TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS =
  "private-error-boundary-diagnostics-root-options-metadata-public-boundary-blocked";

export const REACT_TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_NAME =
  "fast-react-test-renderer.error-boundary.private-root-options-canary";

export const REACT_TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_ROWS = [
  {
    id: "react-test-renderer-update-error-root-option-private-diagnostic",
    phase: "Update",
    area: "update error root option metadata",
    rootErrorChannel: "onUncaughtError",
    privatePrerequisite:
      "TestRendererRoot update error diagnostics read RootOptions error handles",
    publicErrorBoundaryBehaviorAvailable: false,
    publicRootErrorCallbacksInvoked: false,
    nativeExecution: false,
    compatibilityClaimed: false
  },
  {
    id: "react-test-renderer-commit-error-root-option-private-diagnostic",
    phase: "Commit",
    area: "commit error root option metadata",
    rootErrorChannel: "onUncaughtError",
    privatePrerequisite:
      "TestRendererRoot commit error diagnostics read RootOptions error handles",
    publicErrorBoundaryBehaviorAvailable: false,
    publicRootErrorCallbacksInvoked: false,
    nativeExecution: false,
    compatibilityClaimed: false
  }
];

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
  const privateDiagnosticLines =
    REACT_TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_ROWS.map(
      (row) =>
        `- ${row.id}: ${row.phase}; channel: ${row.rootErrorChannel}; status: ${REACT_TEST_RENDERER_PRIVATE_ERROR_BOUNDARY_DIAGNOSTIC_STATUS}`
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
    "",
    "## Fast React Private Error Boundary Diagnostics",
    "",
    ...privateDiagnosticLines,
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
