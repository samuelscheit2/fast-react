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

    return `- ${mode.id}: selected ${loadedFile}; direct native CJS ${directCjsLoaded}/${directCjs.length} loaded`;
  });

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  const gapLines = oracle.intentionalGaps.map((gap) => `- ${gap}`);

  return [
    "# Scheduler Native Entry Oracle",
    "",
    "Generated from the exact scheduler@0.27.0 npm artifact. This oracle records the published native entrypoint behavior and does not claim Fast React scheduler compatibility.",
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

function scenarioObservationKey(scenarioId) {
  return scenarioId.replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
}
