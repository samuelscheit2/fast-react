import { readFileSync } from "node:fs";

import { REACT_DOM_EXPORT_ORACLE_ARTIFACT_PATH } from "./react-dom-export-targets.mjs";

export function stringifyReactDomExportOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactDomExportOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedReactDomExportOracleText(baseUrl));
}

export function readCheckedReactDomExportOracleText(baseUrl = import.meta.url) {
  return readFileSync(
    new URL(`../${REACT_DOM_EXPORT_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatReactDomExportOracleAsMarkdown(oracle) {
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

  const conditionLines = oracle.conditionModes.map((mode) => {
    const resolutions = oracle.conditionResolution[mode.id] ?? [];
    const loaded = resolutions.filter(
      (resolution) => resolution.requireResolve.status === "ok"
    ).length;
    const threw = resolutions.filter(
      (resolution) => resolution.requireResolve.status === "throws"
    ).length;
    return `- ${mode.id}: ${loaded} public subpaths resolved, ${threw} public subpaths blocked`;
  });

  const blockedLines = Object.entries(oracle.blockedPhysicalSubpathProbes).map(
    ([modeId, probes]) => {
      const blocked = probes.filter(
        (probe) => probe.requireResolve.status === "throws"
      ).length;
      return `- ${modeId}: ${blocked} physical .js/CJS subpaths blocked`;
    }
  );

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React React DOM Export Oracle",
    "",
    "Generated from pinned React DOM 19.2.6 package artifacts and the checked runtime inventory. This artifact captures the React DOM package surface only and does not claim Fast React behavior compatibility.",
    "",
    "## Runtime Export Probes",
    "",
    ...runtimeLines,
    "",
    "## Condition Resolution",
    "",
    ...conditionLines,
    "",
    "## Blocked Physical Subpaths",
    "",
    ...blockedLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findReactDomExportObservation(oracle, modeId, subpath) {
  const observation = oracle.runtimeExportObservations[modeId]?.find(
    (candidate) => candidate.subpath === subpath
  );
  if (!observation) {
    throw new Error(`Missing React DOM export observation: ${modeId}:${subpath}`);
  }
  return observation;
}

export function findReactDomConditionResolution(oracle, modeId, subpath) {
  const resolution = oracle.conditionResolution[modeId]?.find(
    (candidate) => candidate.subpath === subpath
  );
  if (!resolution) {
    throw new Error(
      `Missing React DOM condition resolution: ${modeId}:${subpath}`
    );
  }
  return resolution;
}

export function findReactDomBlockedSubpathProbe(oracle, modeId, subpath) {
  const probe = oracle.blockedPhysicalSubpathProbes[modeId]?.find(
    (candidate) => candidate.subpath === subpath
  );
  if (!probe) {
    throw new Error(
      `Missing React DOM blocked subpath probe: ${modeId}:${subpath}`
    );
  }
  return probe;
}
