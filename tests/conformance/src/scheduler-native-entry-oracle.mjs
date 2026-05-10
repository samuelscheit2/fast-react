import { readFileSync } from "node:fs";

import { SCHEDULER_NATIVE_ENTRY_ORACLE_ARTIFACT_PATH } from "./scheduler-native-entry-targets.mjs";

export function stringifySchedulerNativeEntryOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedSchedulerNativeEntryOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(readCheckedSchedulerNativeEntryOracleText(baseUrl));
}

export function readCheckedSchedulerNativeEntryOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${SCHEDULER_NATIVE_ENTRY_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatSchedulerNativeEntryOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.area}; entrypoints: ${scenario.entrypoints.join(", ")}`
  );

  const modeLines = oracle.probeModes.map((mode) => {
    const observations = oracle.observations[mode.id] ?? {};
    const loadedFile =
      observations.nativeEntryLoading?.selectedNativeCjsFile ?? "missing";
    const directCjs = observations.directNativeCjsLoading?.probes ?? [];
    const directCjsLoaded = directCjs.filter(
      (probe) => probe.require.status === "ok"
    ).length;
    const fastReactStatuses = countStatuses(
      Object.values(oracle.fastReactComparisons?.[mode.id] ?? {})
    );

    return `- ${mode.id}: selected ${loadedFile}; direct native CJS ${directCjsLoaded}/${directCjs.length} loaded; Fast React comparisons ${JSON.stringify(fastReactStatuses)}`;
  });

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  const gapLines = oracle.intentionalGaps.map((gap) => `- ${gap}`);

  return [
    "# Scheduler Native Entry Oracle",
    "",
    "Generated from the exact scheduler@0.27.0 npm artifact and the current local scheduler implementation. This oracle records native entrypoint behavior and keeps broad Fast React scheduler compatibility claims false.",
    "",
    "## Scenarios",
    "",
    ...scenarioLines,
    "",
    "## Probe Modes",
    "",
    ...modeLines,
    "",
    "## Intentional Gaps",
    "",
    ...gapLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findSchedulerNativeEntryObservation(oracle, modeId, scenarioId) {
  const key = scenarioObservationKey(scenarioId);
  const observation = oracle.observations[modeId]?.[key];
  if (!observation) {
    throw new Error(
      `Missing scheduler native entry observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findSchedulerNativeEntryResolution(oracle, modeId, specifier) {
  const observation = findSchedulerNativeEntryObservation(
    oracle,
    modeId,
    "native-file-surface"
  );
  const probe = observation.resolution.find(
    (candidate) => candidate.specifier === specifier
  );
  if (!probe) {
    throw new Error(
      `Missing scheduler native entry resolution: ${modeId}:${specifier}`
    );
  }
  return probe;
}

export function findSchedulerNativeEntryDirectCjsProbe(
  oracle,
  modeId,
  specifier
) {
  const observation = findSchedulerNativeEntryObservation(
    oracle,
    modeId,
    "direct-native-cjs-loading"
  );
  const probe = observation.probes.find(
    (candidate) => candidate.specifier === specifier
  );
  if (!probe) {
    throw new Error(
      `Missing scheduler native direct CJS probe: ${modeId}:${specifier}`
    );
  }
  return probe;
}

export function findFastReactSchedulerNativeEntryObservation(
  oracle,
  modeId,
  scenarioId
) {
  const key = scenarioObservationKey(scenarioId);
  const observation = oracle.fastReactObservations?.[modeId]?.[key];
  if (!observation) {
    throw new Error(
      `Missing Fast React scheduler native entry observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findFastReactSchedulerNativeEntryComparison(
  oracle,
  modeId,
  scenarioId
) {
  const key = scenarioObservationKey(scenarioId);
  const comparison = oracle.fastReactComparisons?.[modeId]?.[key];
  if (!comparison) {
    throw new Error(
      `Missing Fast React scheduler native entry comparison: ${modeId}:${scenarioId}`
    );
  }
  return comparison;
}

function countStatuses(comparisons) {
  const counts = {};
  for (const comparison of comparisons) {
    counts[comparison.status] = (counts[comparison.status] ?? 0) + 1;
  }
  return counts;
}

function scenarioObservationKey(scenarioId) {
  return scenarioId.replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
}
