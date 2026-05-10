import { readFileSync } from "node:fs";

import { REACT_TEST_RENDERER_ACT_ORACLE_ARTIFACT_PATH } from "./react-test-renderer-act-targets.mjs";

export const REACT_TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTICS_EXPORT =
  "__FAST_REACT_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTICS__";
const REACT_TEST_RENDERER_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS_EXPORT =
  "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__";

export function stringifyReactTestRendererActOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactTestRendererActOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(readCheckedReactTestRendererActOracleText(baseUrl));
}

export function readCheckedReactTestRendererActOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${REACT_TEST_RENDERER_ACT_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatReactTestRendererActOracleAsMarkdown(oracle) {
  const modeLines = oracle.probeModes.map((mode) => {
    const observations = oracle.reactTestRendererObservations[mode.id] ?? [];
    const available = observations.filter(
      (observation) => observation.result.availability?.status === "available"
    ).length;
    return `- ${mode.id}: ${observations.length} observations, ${available} act-available observations`;
  });

  const scenarioLines = oracle.scenarios.map(
    (scenario) => `- ${scenario.id}: ${scenario.area}`
  );

  const coverageLines = Object.entries(oracle.coverage).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# React Test Renderer Act Oracle",
    "",
    "Generated from pinned react-test-renderer 19.2.6, React 19.2.6, scheduler 0.27.0, and react-is 19.2.6 package artifacts. This artifact captures public act, mock Scheduler, and unstable_flushSync behavior without claiming Fast React compatibility.",
    "",
    "## Probe Modes",
    "",
    ...modeLines,
    "",
    "## Scenarios",
    "",
    ...scenarioLines,
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

export function findReactTestRendererActObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.reactTestRendererObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing React test renderer act observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function inspectReactTestRendererPrivateActPassiveEffectDrainDiagnostics(
  moduleExports
) {
  const scheduler = moduleExports?._Scheduler;
  const helperKeys = [
    "unstable_flushAll",
    "unstable_flushAllWithoutAsserting",
    "unstable_flushExpired",
    "unstable_flushNumberOfYields",
    "unstable_flushUntilNextPaint"
  ];
  const helperDiagnostics = helperKeys.map((key) => {
    const helper = scheduler?.[key];
    const descriptor =
      helper === undefined
        ? undefined
        : Object.getOwnPropertyDescriptor(
            helper,
            REACT_TEST_RENDERER_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS_EXPORT
          );
    const diagnostics =
      descriptor?.value?.privateActPassiveEffectDrainDiagnostics ?? null;
    return {
      key,
      hasDiagnostics: diagnostics !== null,
      descriptor:
        descriptor === undefined
          ? null
          : {
              enumerable: descriptor.enumerable,
              writable: descriptor.writable,
              configurable: descriptor.configurable
            },
      diagnostics
    };
  });

  return {
    exportName:
      REACT_TEST_RENDERER_PRIVATE_ACT_PASSIVE_EFFECT_DRAIN_DIAGNOSTICS_EXPORT,
    helperKeys,
    available: helperDiagnostics.every((row) => row.hasDiagnostics),
    helperDiagnostics
  };
}
