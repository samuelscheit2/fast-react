import { readFileSync } from "node:fs";

import { SCHEDULER_VARIANT_ORACLE_ARTIFACT_PATH } from "./scheduler-variant-targets.mjs";

export function stringifySchedulerVariantOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedSchedulerVariantOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedSchedulerVariantOracleText(baseUrl));
}

export function readCheckedSchedulerVariantOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${SCHEDULER_VARIANT_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatSchedulerVariantOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.area}; entrypoints: ${scenario.entrypoints.join(", ")}`
  );

  const modeLines = oracle.probeModes.map((mode) => {
    const observations = oracle.observations[mode.id] ?? {};
    const cjsProbes = observations.deepCjsRequire?.probes ?? [];
    const cjsLoaded = cjsProbes.filter(
      (probe) => probe.require.status === "ok"
    ).length;
    const cjsThrew = cjsProbes.filter(
      (probe) => probe.require.status === "throws"
    ).length;

    return `- ${mode.id}: mock helpers ${
      observations.unstableMock?.exportKeys?.length ?? 0
    } exports, post-task plain import ${
      observations.unstablePostTaskPlainNode?.require?.require?.status ??
      "missing"
    }, CJS deep imports ${cjsLoaded} loaded/${cjsThrew} threw`;
  });

  const decisionLines = oracle.compatibilityGateRecommendations.map(
    (decision) =>
      `- ${decision.surface}: ${decision.recommendation}; ${decision.reason}`
  );

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React Scheduler Variant Oracle",
    "",
    "Generated from exact scheduler@0.27.0 artifacts. This oracle records variant and physical deep-import behavior but does not claim Fast React scheduler compatibility.",
    "",
    "## Scenarios",
    "",
    ...scenarioLines,
    "",
    "## Probe Modes",
    "",
    ...modeLines,
    "",
    "## Gate Recommendations",
    "",
    ...decisionLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findSchedulerVariantResolution(oracle, specifier) {
  const probe = oracle.packageResolution.resolution.find(
    (candidate) => candidate.specifier === specifier
  );
  if (!probe) {
    throw new Error(`Missing scheduler variant resolution probe: ${specifier}`);
  }
  return probe;
}

export function findSchedulerVariantDeepCjsProbe(oracle, modeId, specifier) {
  const probe = oracle.observations[modeId]?.deepCjsRequire?.probes.find(
    (candidate) => candidate.specifier === specifier
  );
  if (!probe) {
    throw new Error(
      `Missing scheduler variant deep CJS probe: ${modeId}:${specifier}`
    );
  }
  return probe;
}
