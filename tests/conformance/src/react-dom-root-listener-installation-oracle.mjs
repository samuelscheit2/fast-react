import { readFileSync } from "node:fs";

import {
  REACT_DOM_ROOT_LISTENER_INSTALLATION_ORACLE_ARTIFACT_PATH
} from "./react-dom-root-listener-installation-targets.mjs";

export function stringifyReactDomRootListenerInstallationOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactDomRootListenerInstallationOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(
    readCheckedReactDomRootListenerInstallationOracleText(baseUrl)
  );
}

export function readCheckedReactDomRootListenerInstallationOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(
      `../${REACT_DOM_ROOT_LISTENER_INSTALLATION_ORACLE_ARTIFACT_PATH}`,
      baseUrl
    ),
    "utf8"
  );
}

export function formatReactDomRootListenerInstallationOracleAsMarkdown(oracle) {
  const observationLines = oracle.probeModes.map((mode) => {
    const observations = oracle.listenerInstallationObservations[mode.id] ?? [];
    return `- ${mode.id}: ${observations.length} listener-installation scenarios`;
  });

  const rootLines = oracle.probeModes.map((mode) => {
    const observation = findReactDomRootListenerInstallationObservation(
      oracle,
      mode.id,
      "create-root-root-container"
    );
    return `- ${mode.id}: ${observation.after.rootContainer.listenerCount} root-container listeners, ${observation.after.ownerDocument.listenerCount} owner-document listeners`;
  });

  const coverageLines = Object.entries(oracle.coverage).map(
    ([key, value]) => `- ${key}: ${value}`
  );
  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React React DOM Root Listener Installation Oracle",
    "",
    "Generated from pinned React DOM 19.2.6 package artifacts. This artifact captures root and portal listener installation side effects only; it does not claim Fast React behavior compatibility.",
    "",
    "## Observations",
    "",
    ...observationLines,
    "",
    "## Root Listener Counts",
    "",
    ...rootLines,
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

export function findReactDomRootListenerInstallationObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.listenerInstallationObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing React DOM root listener installation observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findReactDomRootListenerRegisteredEvent(
  targetSummary,
  eventName
) {
  const registration = targetSummary.byEvent.find(
    (candidate) => candidate.eventName === eventName
  );
  if (!registration) {
    throw new Error(`Missing listener registration for ${eventName}`);
  }
  return registration;
}
