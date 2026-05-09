import { readFileSync } from "node:fs";

import { REACT_DOM_HYDRATION_MARKER_ORACLE_ARTIFACT_PATH } from "./react-dom-hydration-marker-targets.mjs";

export function stringifyReactDomHydrationMarkerOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactDomHydrationMarkerOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(readCheckedReactDomHydrationMarkerOracleText(baseUrl));
}

export function readCheckedReactDomHydrationMarkerOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${REACT_DOM_HYDRATION_MARKER_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatReactDomHydrationMarkerOracleAsMarkdown(oracle) {
  const markerLines = oracle.markerContracts.map(
    (contract) =>
      `- ${contract.id}: ${contract.area}; marker: ${contract.serializedMarker ?? contract.commentData ?? "template data"}`
  );

  const mismatchLines = oracle.mismatchContracts.map(
    (contract) =>
      `- ${contract.id}: ${contract.sourceFunction}; delivery: ${contract.delivery}`
  );

  const sourceLines = oracle.pinnedSourceFiles.map(
    (sourceFile) =>
      `- ${sourceFile.id}: ${sourceFile.path}; ${sourceFile.lineCount} lines`
  );

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React React DOM Hydration Marker Oracle",
    "",
    "Generated from pinned React DOM 19.2.6 package artifacts, accepted worker reports, and React source at the checked v19.2.6 commit. This artifact captures marker and mismatch contracts only and does not claim Fast React hydration compatibility.",
    "",
    "## Marker Contracts",
    "",
    ...markerLines,
    "",
    "## Mismatch Contracts",
    "",
    ...mismatchLines,
    "",
    "## Pinned Source Files",
    "",
    ...sourceLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findReactDomHydrationMarkerContract(oracle, id) {
  const contract = oracle.markerContracts.find(
    (candidate) => candidate.id === id
  );
  if (!contract) {
    throw new Error(`Missing React DOM hydration marker contract: ${id}`);
  }
  return contract;
}

export function findReactDomHydrationMismatchContract(oracle, id) {
  const contract = oracle.mismatchContracts.find(
    (candidate) => candidate.id === id
  );
  if (!contract) {
    throw new Error(`Missing React DOM hydration mismatch contract: ${id}`);
  }
  return contract;
}
