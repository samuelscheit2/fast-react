import { readFileSync } from "node:fs";

import { REACT_DOM_FLUSH_SYNC_BATCHING_ORACLE_ARTIFACT_PATH } from "./react-dom-flush-sync-batching-targets.mjs";

export function stringifyReactDomFlushSyncBatchingOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactDomFlushSyncBatchingOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(readCheckedReactDomFlushSyncBatchingOracleText(baseUrl));
}

export function readCheckedReactDomFlushSyncBatchingOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(
      `../${REACT_DOM_FLUSH_SYNC_BATCHING_ORACLE_ARTIFACT_PATH}`,
      baseUrl
    ),
    "utf8"
  );
}

export function formatReactDomFlushSyncBatchingOracleAsMarkdown(oracle) {
  const observationLines = oracle.probeModes.map((mode) => {
    const observations = oracle.reactDomObservations[mode.id] ?? [];
    const available = observations.filter(
      (observation) =>
        observation.result.availability?.status === "available" ||
        observation.scenarioId ===
          "react-dom-flush-sync-batching-export-shape"
    ).length;
    const unavailable = observations.length - available;
    return `- ${mode.id}: ${observations.length} observations, ${available} available/default-shape, ${unavailable} unavailable`;
  });

  const coverageLines = Object.entries(oracle.coverage).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React React DOM Flush Sync And Batching Oracle",
    "",
    "Generated from pinned React DOM 19.2.6, React 19.2.6, and scheduler 0.27.0 package artifacts. This artifact captures public flushSync and unstable_batchedUpdates behavior without claiming Fast React React DOM compatibility.",
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

export function findReactDomFlushSyncBatchingObservation(
  oracle,
  modeId,
  entrypointId,
  scenarioId
) {
  const observation = oracle.reactDomObservations[modeId]?.find(
    (candidate) =>
      candidate.entrypointId === entrypointId &&
      candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing React DOM flushSync/batching observation: ${modeId}:${entrypointId}:${scenarioId}`
    );
  }
  return observation;
}
