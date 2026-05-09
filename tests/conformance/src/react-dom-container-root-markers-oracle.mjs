import { readFileSync } from "node:fs";

import {
  REACT_DOM_CONTAINER_ROOT_MARKERS_ORACLE_ARTIFACT_PATH
} from "./react-dom-container-root-markers-targets.mjs";

export function stringifyReactDomContainerRootMarkersOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactDomContainerRootMarkersOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(readCheckedReactDomContainerRootMarkersOracleText(baseUrl));
}

export function readCheckedReactDomContainerRootMarkersOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(
      `../${REACT_DOM_CONTAINER_ROOT_MARKERS_ORACLE_ARTIFACT_PATH}`,
      baseUrl
    ),
    "utf8"
  );
}

export function formatReactDomContainerRootMarkersOracleAsMarkdown(oracle) {
  const modeLines = oracle.probeModes.map((mode) => {
    const observation = findReactDomContainerRootMarkersObservation(
      oracle,
      mode.id
    );
    return `- ${mode.id}: ${observation.result.containerValidation.length} container cases, duplicate warning calls ${observation.result.duplicateRootWarning.secondCreate.consoleCalls.length}`;
  });

  const coverageLines = Object.entries(oracle.coverage).map(
    ([key, value]) => `- ${key}: ${value}`
  );
  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React DOM Container Root Markers Oracle",
    "",
    "Generated from pinned React DOM 19.2.6 package artifacts. This artifact captures createRoot container validation, root marker side effects, duplicate-root diagnostics, and unmount marker cleanup only; it does not claim Fast React behavior compatibility.",
    "",
    "## Probe Modes",
    "",
    ...modeLines,
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

export function findReactDomContainerRootMarkersObservation(oracle, modeId) {
  const observation = oracle.containerRootMarkerObservations[modeId];
  if (!observation) {
    throw new Error(
      `Missing React DOM container root marker observation: ${modeId}`
    );
  }
  return observation;
}

export function findReactDomContainerValidationCase(observation, caseId) {
  const validationRows =
    observation.result?.containerValidation ?? observation.containerValidation;
  const validationCase = validationRows.find(
    (candidate) => candidate.caseId === caseId
  );
  if (!validationCase) {
    throw new Error(`Missing React DOM container validation case: ${caseId}`);
  }
  return validationCase;
}
