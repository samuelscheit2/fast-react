import { readFileSync } from "node:fs";

import { REACT_TEST_RENDERER_EXPORT_ORACLE_ARTIFACT_PATH } from "./react-test-renderer-export-targets.mjs";

export function stringifyReactTestRendererExportOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactTestRendererExportOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(readCheckedReactTestRendererExportOracleText(baseUrl));
}

export function readCheckedReactTestRendererExportOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${REACT_TEST_RENDERER_EXPORT_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatReactTestRendererExportOracleAsMarkdown(oracle) {
  const runtimeLines = oracle.probeModes.map((mode) => {
    const observations = oracle.runtimeExportObservations[mode.id] ?? [];
    const loaded = observations.filter(
      (observation) => observation.require.status === "ok"
    ).length;
    const threw = observations.filter(
      (observation) => observation.require.status === "throws"
    ).length;
    return `- ${mode.id}: ${loaded} require probes loaded, ${threw} require probes threw`;
  });

  const warningLines = oracle.createWarningObservations.map((observation) => {
    return `- ${observation.id}: ${observation.warnings.length} console.error calls`;
  });

  const shallowLines = Object.entries(oracle.shallowRemovalObservations).map(
    ([modeId, observations]) => {
      const throwingCalls = observations.filter(
        (observation) =>
          observation.callWithoutNew.status === "throws" &&
          observation.constructWithNew.status === "throws"
      ).length;
      return `- ${modeId}: ${throwingCalls}/${observations.length} shallow entrypoints throw on invocation`;
    }
  );

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# React Test Renderer Export Oracle",
    "",
    "Generated from exact react-test-renderer@19.2.6 package artifacts. This oracle captures package exports, descriptors, shallow removal, and warning surfaces without claiming Fast React compatibility.",
    "",
    "## Runtime Export Probes",
    "",
    ...runtimeLines,
    "",
    "## Create Warning Surface",
    "",
    ...warningLines,
    "",
    "## Shallow Removal",
    "",
    ...shallowLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findReactTestRendererExportObservation(
  oracle,
  modeId,
  subpath
) {
  const observation = oracle.runtimeExportObservations[modeId]?.find(
    (candidate) => candidate.subpath === subpath
  );
  if (!observation) {
    throw new Error(
      `Missing react-test-renderer export observation: ${modeId}:${subpath}`
    );
  }
  return observation;
}

export function findReactTestRendererConditionResolution(
  oracle,
  modeId,
  subpath
) {
  const resolution = oracle.conditionResolution[modeId]?.find(
    (candidate) => candidate.subpath === subpath
  );
  if (!resolution) {
    throw new Error(
      `Missing react-test-renderer condition resolution: ${modeId}:${subpath}`
    );
  }
  return resolution;
}

export function findReactTestRendererCreateWarningObservation(
  oracle,
  scenarioId
) {
  const observation = oracle.createWarningObservations.find(
    (candidate) => candidate.id === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing react-test-renderer create warning observation: ${scenarioId}`
    );
  }
  return observation;
}

export function findReactTestRendererShallowRemovalObservation(
  oracle,
  modeId,
  subpath
) {
  const observation = oracle.shallowRemovalObservations[modeId]?.find(
    (candidate) => candidate.subpath === subpath
  );
  if (!observation) {
    throw new Error(
      `Missing react-test-renderer shallow observation: ${modeId}:${subpath}`
    );
  }
  return observation;
}
