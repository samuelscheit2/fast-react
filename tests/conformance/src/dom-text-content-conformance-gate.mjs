import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  findDomTextContentShouldSetObservation,
  readCheckedDomTextContentOracle
} from "./dom-text-content-oracle.mjs";
import {
  DOM_TEXT_CONTENT_RENDER_SCENARIOS,
  DOM_TEXT_CONTENT_SCENARIO_IDS,
  DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS,
  materializeProps
} from "./dom-text-content-scenarios.mjs";
import {
  DOM_TEXT_CONTENT_PROBE_MODES,
  DOM_TEXT_CONTENT_TARGET
} from "./dom-text-content-targets.mjs";
import {
  DOM_TEXT_CONTENT_LOCAL_GATE_STATUS,
  inspectDomTextContentLocalTargets
} from "./dom-text-content-local-gate.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const require = createRequire(import.meta.url);

const LOCAL_REACT_STUB = Object.freeze({
  createElement(elementType, props) {
    return {
      $$typeof: "react.element.placeholder",
      type: elementType,
      props
    };
  }
});

export const DOM_TEXT_CONTENT_CONFORMANCE_GATE_ID =
  "dom-text-content-dual-run-gate-1";

export const DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_TEXT_CONTENT_TARGET = {
  packageName: "@fast-react/react-dom",
  version: "0.0.0",
  role: "workspace-fast-react-private-dom-text-content-helper",
  entrypoint:
    "packages/react-dom/src/dom-host/text-content.js#shouldSetTextContent"
};

export const DOM_TEXT_CONTENT_PRIVATE_SHOULD_SET_MATCH_STATUS =
  "matched-react-dom-19.2.6-private-should-set-text-content";

export const DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_SHOULD_SET_STATUS =
  "skipped-unsupported-private-text-content-slice";

export const DOM_TEXT_CONTENT_UNSUPPORTED_DOM_RENDER_STATUS =
  "skipped-unsupported-dom-mutation-root-path";

export const DOM_TEXT_CONTENT_ADMITTED_PRIVATE_SHOULD_SET_SCENARIO_IDS =
  Object.freeze([
    "should-set-string-child",
    "should-set-empty-string-child",
    "should-set-number-child",
    "should-set-bigint-child",
    "should-not-set-nullish-children",
    "should-not-set-boolean-child",
    "should-not-set-array-children",
    "should-not-set-react-element-child",
    "should-not-set-symbol-child",
    "should-not-set-function-child",
    "should-set-dangerous-html-non-null",
    "should-set-dangerous-html-empty-string",
    "should-not-set-dangerous-html-nullish",
    "should-not-set-dangerous-html-invalid-shape",
    "should-set-dangerous-html-even-with-conflicting-child"
  ]);

export const DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_SHOULD_SET_SCENARIOS =
  Object.freeze([
    {
      scenarioId: "should-set-textarea-special-case",
      gateStatus: DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_SHOULD_SET_STATUS,
      reason:
        "React DOM's private predicate returns true for textarea, but Fast React keeps the local helper false until controlled form, defaultValue/value tracking, and textarea text-content side effects are implemented."
    },
    {
      scenarioId: "should-set-noscript-special-case",
      gateStatus: DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_SHOULD_SET_STATUS,
      reason:
        "React DOM's private predicate returns true for noscript, but Fast React keeps the local helper false until browser and server noscript behavior is explicitly implemented."
    }
  ]);

export const DOM_TEXT_CONTENT_CONFORMANCE_GATE = {
  id: DOM_TEXT_CONTENT_CONFORMANCE_GATE_ID,
  reactDomOracle: `${DOM_TEXT_CONTENT_TARGET.packageName}@${DOM_TEXT_CONTENT_TARGET.version}`,
  localTargetPackageName:
    DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_TEXT_CONTENT_TARGET.packageName,
  localEntrypoint:
    DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_TEXT_CONTENT_TARGET.entrypoint,
  admittedPrivateShouldSetScenarioIds:
    DOM_TEXT_CONTENT_ADMITTED_PRIVATE_SHOULD_SET_SCENARIO_IDS,
  unsupportedPrivateShouldSetScenarioIds:
    DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_SHOULD_SET_SCENARIOS.map(
      (scenario) => scenario.scenarioId
    ),
  unsupportedDomRenderPaths: {
    gateStatus: DOM_TEXT_CONTENT_UNSUPPORTED_DOM_RENDER_STATUS,
    serverSerializationCompared: false,
    clientMutationCompared: false,
    compatibilityClaimed: false
  }
};

export function runDomTextContentConformanceGate({
  checkedOracle = readCheckedDomTextContentOracle(),
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  const localChecks = inspectDomTextContentLocalTargets({ workspaceRoot });
  const localShouldSetTextContentObservations =
    runLocalDomTextContentShouldSetObservations({ workspaceRoot });

  return evaluateDomTextContentConformanceGate({
    checkedOracle,
    localChecks,
    localShouldSetTextContentObservations
  });
}

export function evaluateDomTextContentConformanceGate({
  checkedOracle,
  localChecks = inspectDomTextContentLocalTargets(),
  localShouldSetTextContentObservations
} = {}) {
  const failures = [];
  const admittedPrivateShouldSetRows = [];
  const skippedUnsupportedPrivateShouldSetRows = [];
  const skippedUnsupportedDomRenderRows = [];

  if (!checkedOracle) {
    failures.push({
      gateStatus: "missing-checked-dom-text-content-oracle"
    });
  }

  const localObservations =
    localShouldSetTextContentObservations ??
    runLocalDomTextContentShouldSetObservations();
  const localObservationByScenario = new Map(
    localObservations.observations.map((observation) => [
      observation.scenarioId,
      observation
    ])
  );
  const shouldSetAdmissions = buildShouldSetAdmissionMap();

  validateOracleShape({ checkedOracle, failures });
  validateAdmissionMetadata({ shouldSetAdmissions, failures });

  if (!localChecks.privateShouldSetTextContentHelperPresent) {
    failures.push({
      gateStatus: "missing-local-private-should-set-text-content-helper"
    });
  }

  if (localObservations.loadError) {
    failures.push({
      gateStatus: "local-private-should-set-text-content-load-failed",
      error: localObservations.loadError
    });
  }

  if (checkedOracle) {
    for (const scenario of DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS) {
      const admission = shouldSetAdmissions.get(scenario.id);
      const checkedObservation = findShouldSetObservationOrNull(
        checkedOracle,
        scenario.id
      );

      if (!checkedObservation) {
        failures.push({
          scenarioId: scenario.id,
          gateStatus: "missing-react-dom-should-set-observation"
        });
        continue;
      }

      if (admission?.admission === "admitted") {
        const localObservation = localObservationByScenario.get(scenario.id);
        if (!localObservation) {
          failures.push({
            scenarioId: scenario.id,
            gateStatus: "missing-local-private-should-set-observation"
          });
          continue;
        }

        const firstDifferencePath = findFirstDifferencePath(
          checkedObservation.result,
          localObservation.result
        );
        if (firstDifferencePath === null) {
          admittedPrivateShouldSetRows.push({
            scenarioId: scenario.id,
            gateStatus: DOM_TEXT_CONTENT_PRIVATE_SHOULD_SET_MATCH_STATUS
          });
        } else {
          failures.push({
            scenarioId: scenario.id,
            gateStatus: "admitted-private-should-set-output-mismatch",
            firstDifferencePath
          });
        }
        continue;
      }

      if (admission?.admission === "unsupported") {
        const localObservation = localObservationByScenario.get(scenario.id);
        if (!localObservation) {
          failures.push({
            scenarioId: scenario.id,
            gateStatus: "missing-local-private-should-set-observation"
          });
          continue;
        }

        const firstDifferencePath = findFirstDifferencePath(
          checkedObservation.result,
          localObservation.result
        );
        if (firstDifferencePath === null) {
          failures.push({
            scenarioId: scenario.id,
            gateStatus: "private-should-set-row-skipped-despite-local-match",
            reason:
              "Private shouldSetTextContent rows that match the checked React DOM oracle must be admitted instead of skipped."
          });
          continue;
        }

        skippedUnsupportedPrivateShouldSetRows.push({
          scenarioId: scenario.id,
          gateStatus: admission.gateStatus,
          reason: admission.reason,
          checkedResult: checkedObservation.result,
          localResult: localObservation.result,
          firstDifferencePath
        });
        continue;
      }

      failures.push({
        scenarioId: scenario.id,
        gateStatus: "missing-private-should-set-admission"
      });
    }

    for (const mode of DOM_TEXT_CONTENT_PROBE_MODES) {
      for (const scenario of DOM_TEXT_CONTENT_RENDER_SCENARIOS) {
        const serverObservation = findRenderObservationOrNull({
          oracle: checkedOracle,
          modeId: mode.id,
          observationKind: "serverSerialization",
          scenarioId: scenario.id
        });
        const clientObservation = findRenderObservationOrNull({
          oracle: checkedOracle,
          modeId: mode.id,
          observationKind: "clientMutation",
          scenarioId: scenario.id
        });

        if (!serverObservation || !clientObservation) {
          failures.push({
            modeId: mode.id,
            scenarioId: scenario.id,
            gateStatus: "missing-react-dom-render-observation",
            serverSerializationObservationFound: Boolean(serverObservation),
            clientMutationObservationFound: Boolean(clientObservation)
          });
          continue;
        }

        for (const observationKind of [
          "serverSerialization",
          "clientMutation"
        ]) {
          skippedUnsupportedDomRenderRows.push({
            modeId: mode.id,
            scenarioId: scenario.id,
            observationKind,
            gateStatus: DOM_TEXT_CONTENT_UNSUPPORTED_DOM_RENDER_STATUS,
            reason:
              "The local gate compares only the implemented private shouldSetTextContent helper; public root rendering, server rendering, and DOM mutation output remain unsupported."
          });
        }
      }
    }
  }

  if (
    skippedUnsupportedPrivateShouldSetRows.length > 0 ||
    skippedUnsupportedDomRenderRows.length > 0
  ) {
    rejectCompatibilityClaimsWhileSkipped({ checkedOracle, failures });
  }

  const ok = failures.length === 0;

  return {
    gate: DOM_TEXT_CONTENT_CONFORMANCE_GATE,
    ok,
    localChecks,
    localObservationMetadata: localObservations.metadata,
    admittedPrivateShouldSetRows,
    skippedUnsupportedPrivateShouldSetRows,
    skippedUnsupportedDomRenderRows,
    failures,
    summary: {
      admittedPrivateShouldSetRowCount: admittedPrivateShouldSetRows.length,
      skippedUnsupportedPrivateShouldSetRowCount:
        skippedUnsupportedPrivateShouldSetRows.length,
      skippedUnsupportedDomRenderRowCount:
        skippedUnsupportedDomRenderRows.length,
      failureCount: failures.length,
      totalShouldSetScenarioCount:
        DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS.length,
      totalRenderScenarioModePathCount:
        DOM_TEXT_CONTENT_RENDER_SCENARIOS.length *
        DOM_TEXT_CONTENT_PROBE_MODES.length *
        2,
      privateTextContentBehaviorCompared: ok,
      fullDomTextContentCompatibilityAdmitted:
        ok &&
        skippedUnsupportedPrivateShouldSetRows.length === 0 &&
        skippedUnsupportedDomRenderRows.length === 0,
      compatibilityClaimed: false
    }
  };
}

export function runLocalDomTextContentShouldSetObservations({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  const loadResult = loadLocalPrivateTextContentHelper({ workspaceRoot });
  if (loadResult.error) {
    return {
      metadata: {
        target: DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_TEXT_CONTENT_TARGET,
        observationKind: "private-shouldSetTextContent",
        loaded: false
      },
      loadError: loadResult.error,
      observations: []
    };
  }

  return {
    metadata: {
      target: DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_TEXT_CONTENT_TARGET,
      observationKind: "private-shouldSetTextContent",
      loaded: true
    },
    loadError: null,
    observations: DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS.map((scenario) =>
      runLocalShouldSetTextContentProbe({
        scenario,
        shouldSetTextContent: loadResult.shouldSetTextContent
      })
    )
  };
}

export function formatDomTextContentConformanceGateResult(result) {
  const lines = [
    `DOM text-content conformance gate: ${result.ok ? "PASS" : "FAIL"}`,
    `Gate: ${result.gate.id}`,
    `React oracle: ${result.gate.reactDomOracle}`,
    `Local target: ${result.gate.localTargetPackageName}`,
    `Local entrypoint: ${result.gate.localEntrypoint}`,
    `Admitted private shouldSetTextContent rows compared: ${result.summary.admittedPrivateShouldSetRowCount}`,
    `Skipped unsupported private shouldSetTextContent rows: ${result.summary.skippedUnsupportedPrivateShouldSetRowCount}`,
    `Skipped unsupported DOM render/mutation rows: ${result.summary.skippedUnsupportedDomRenderRowCount}`,
    `Failures: ${result.summary.failureCount}`
  ];

  if (
    result.skippedUnsupportedPrivateShouldSetRows.length > 0 ||
    result.skippedUnsupportedDomRenderRows.length > 0
  ) {
    lines.push(
      "Full DOM text-content compatibility remains blocked; unsupported private slices and DOM mutation/root paths are not admitted as passing behavior."
    );
  }

  if (result.failures.length > 0) {
    lines.push("", "Failure details:");
    for (const failure of result.failures.slice(0, 20)) {
      lines.push(`- ${formatGateFailure(failure)}`);
    }
    if (result.failures.length > 20) {
      lines.push(`- ... ${result.failures.length - 20} more`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function buildShouldSetAdmissionMap() {
  const unsupportedByScenario = new Map(
    DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_SHOULD_SET_SCENARIOS.map(
      (scenario) => [scenario.scenarioId, scenario]
    )
  );
  const admitted = new Set(
    DOM_TEXT_CONTENT_ADMITTED_PRIVATE_SHOULD_SET_SCENARIO_IDS
  );
  const admissions = new Map();

  for (const scenario of DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS) {
    if (admitted.has(scenario.id)) {
      admissions.set(scenario.id, {
        scenarioId: scenario.id,
        admission: "admitted",
        gateStatus: DOM_TEXT_CONTENT_PRIVATE_SHOULD_SET_MATCH_STATUS
      });
      continue;
    }

    const unsupported = unsupportedByScenario.get(scenario.id);
    if (unsupported) {
      admissions.set(scenario.id, {
        ...unsupported,
        admission: "unsupported"
      });
    }
  }

  return admissions;
}

function validateAdmissionMetadata({ shouldSetAdmissions, failures }) {
  const knownScenarioIds = new Set(DOM_TEXT_CONTENT_SCENARIO_IDS);
  const admittedIds = new Set(
    DOM_TEXT_CONTENT_ADMITTED_PRIVATE_SHOULD_SET_SCENARIO_IDS
  );

  for (const scenarioId of admittedIds) {
    if (!knownScenarioIds.has(scenarioId)) {
      failures.push({
        scenarioId,
        gateStatus: "unknown-admitted-private-should-set-scenario"
      });
    }
  }

  for (const unsupported of DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_SHOULD_SET_SCENARIOS) {
    if (!knownScenarioIds.has(unsupported.scenarioId)) {
      failures.push({
        scenarioId: unsupported.scenarioId,
        gateStatus: "unknown-unsupported-private-should-set-scenario"
      });
    }
    if (admittedIds.has(unsupported.scenarioId)) {
      failures.push({
        scenarioId: unsupported.scenarioId,
        gateStatus: "private-should-set-admission-conflict"
      });
    }
    if (typeof unsupported.reason !== "string" || unsupported.reason.length === 0) {
      failures.push({
        scenarioId: unsupported.scenarioId,
        gateStatus: "unsupported-private-should-set-missing-reason"
      });
    }
  }

  for (const scenario of DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS) {
    if (!shouldSetAdmissions.has(scenario.id)) {
      failures.push({
        scenarioId: scenario.id,
        gateStatus: "missing-private-should-set-admission"
      });
    }
  }

  for (const scenario of DOM_TEXT_CONTENT_RENDER_SCENARIOS) {
    if (admittedIds.has(scenario.id)) {
      failures.push({
        scenarioId: scenario.id,
        gateStatus: "dom-render-scenario-admitted-through-private-gate"
      });
    }
  }
}

function validateOracleShape({ checkedOracle, failures }) {
  if (!checkedOracle) {
    return;
  }

  if (checkedOracle.oracleKind !== "react-19.2.6-dom-text-content-oracle") {
    failures.push({
      gateStatus: "checked-oracle-kind-mismatch",
      oracleKind: checkedOracle.oracleKind ?? null
    });
  }

  if (
    checkedOracle.reactDomTarget?.packageName !==
      DOM_TEXT_CONTENT_TARGET.packageName ||
    checkedOracle.reactDomTarget?.version !== DOM_TEXT_CONTENT_TARGET.version
  ) {
    failures.push({
      gateStatus: "checked-oracle-react-dom-target-mismatch",
      reactDomTarget: checkedOracle.reactDomTarget ?? null
    });
  }

  if (
    !Array.isArray(checkedOracle.shouldSetTextContentScenarios) ||
    !Array.isArray(checkedOracle.renderScenarios)
  ) {
    failures.push({
      gateStatus: "checked-oracle-scenario-shape-mismatch"
    });
    return;
  }

  const checkedShouldSetIds = checkedOracle.shouldSetTextContentScenarios.map(
    (scenario) => scenario.id
  );
  const expectedShouldSetIds = DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS.map(
    (scenario) => scenario.id
  );
  const checkedRenderIds = checkedOracle.renderScenarios.map(
    (scenario) => scenario.id
  );
  const expectedRenderIds = DOM_TEXT_CONTENT_RENDER_SCENARIOS.map(
    (scenario) => scenario.id
  );

  if (findFirstDifferencePath(checkedShouldSetIds, expectedShouldSetIds) !== null) {
    failures.push({
      gateStatus: "checked-oracle-should-set-scenario-list-mismatch"
    });
  }

  if (findFirstDifferencePath(checkedRenderIds, expectedRenderIds) !== null) {
    failures.push({
      gateStatus: "checked-oracle-render-scenario-list-mismatch"
    });
  }
}

function rejectCompatibilityClaimsWhileSkipped({ checkedOracle, failures }) {
  for (const key of [
    "fastReactBehaviorCompatible",
    "fullDualRunOracleExists",
    "compatibilityClaimed"
  ]) {
    if (checkedOracle?.conformanceClaims?.[key] !== false) {
      failures.push({
        gateStatus: `checked-oracle-claims-${key}-while-unsupported-rows-skipped`,
        value: checkedOracle?.conformanceClaims?.[key] ?? null
      });
    }
  }

  if (checkedOracle?.localFastReactStatus?.behaviorCompatibilityClaimed !== false) {
    failures.push({
      gateStatus:
        "checked-oracle-local-fast-react-status-claims-compatibility-while-unsupported-rows-skipped",
      value:
        checkedOracle?.localFastReactStatus?.behaviorCompatibilityClaimed ?? null
    });
  }

  if (checkedOracle?.localFastReactStatus?.status !== DOM_TEXT_CONTENT_LOCAL_GATE_STATUS) {
    failures.push({
      gateStatus:
        "checked-oracle-local-fast-react-status-not-blocked-while-render-paths-skipped",
      value: checkedOracle?.localFastReactStatus?.status ?? null
    });
  }
}

function findShouldSetObservationOrNull(oracle, scenarioId) {
  try {
    return findDomTextContentShouldSetObservation(oracle, scenarioId);
  } catch {
    return null;
  }
}

function findRenderObservationOrNull({
  oracle,
  modeId,
  observationKind,
  scenarioId
}) {
  const observations =
    observationKind === "serverSerialization"
      ? oracle.serverSerializationObservations?.[modeId]
      : oracle.clientMutationObservations?.[modeId];
  return (
    observations?.find(
      (observation) =>
        observation.scenarioId === scenarioId &&
        observation.action ===
          (observationKind === "serverSerialization" ? "server" : "client")
    ) ?? null
  );
}

function loadLocalPrivateTextContentHelper({ workspaceRoot }) {
  const modulePath = join(
    workspaceRoot,
    "packages/react-dom/src/dom-host/text-content.js"
  );

  try {
    const helper = require(modulePath);
    if (typeof helper.shouldSetTextContent !== "function") {
      return {
        error: {
          name: "TypeError",
          message:
            "Local private text-content module does not export shouldSetTextContent"
        }
      };
    }
    return {
      shouldSetTextContent: helper.shouldSetTextContent,
      error: null
    };
  } catch (error) {
    return {
      error: describeThrown(error)
    };
  }
}

function runLocalShouldSetTextContentProbe({
  scenario,
  shouldSetTextContent
}) {
  const props = materializeProps(LOCAL_REACT_STUB, scenario.props);
  try {
    return {
      scenarioId: scenario.id,
      action: "shouldSetTextContent",
      targetPackage:
        DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_TEXT_CONTENT_TARGET.packageName,
      entrypoint:
        DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_TEXT_CONTENT_TARGET.entrypoint,
      hostType: scenario.hostType,
      result: {
        status: "ok",
        value: Boolean(shouldSetTextContent(scenario.hostType, props))
      }
    };
  } catch (error) {
    return {
      scenarioId: scenario.id,
      action: "shouldSetTextContent",
      targetPackage:
        DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_TEXT_CONTENT_TARGET.packageName,
      entrypoint:
        DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_TEXT_CONTENT_TARGET.entrypoint,
      hostType: scenario.hostType,
      result: {
        status: "throws",
        error: describeThrown(error)
      }
    };
  }
}

function describeThrown(error) {
  return {
    name: error?.name ?? "Error",
    message: error?.message ?? String(error),
    code: typeof error?.code === "string" ? error.code : null
  };
}

function findFirstDifferencePath(left, right, path = "$") {
  if (Object.is(left, right)) {
    return null;
  }

  if (
    left === null ||
    right === null ||
    typeof left !== "object" ||
    typeof right !== "object"
  ) {
    return path;
  }

  const leftIsArray = Array.isArray(left);
  const rightIsArray = Array.isArray(right);
  if (leftIsArray !== rightIsArray) {
    return path;
  }

  if (leftIsArray) {
    if (left.length !== right.length) {
      return `${path}.length`;
    }
    for (let index = 0; index < left.length; index += 1) {
      const childPath = findFirstDifferencePath(
        left[index],
        right[index],
        `${path}[${index}]`
      );
      if (childPath) {
        return childPath;
      }
    }
    return null;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return `${path}.keys`;
  }
  for (let index = 0; index < leftKeys.length; index += 1) {
    if (leftKeys[index] !== rightKeys[index]) {
      return `${path}.keys[${index}]`;
    }
  }
  for (const key of leftKeys) {
    const childPath = findFirstDifferencePath(
      left[key],
      right[key],
      `${path}.${key}`
    );
    if (childPath) {
      return childPath;
    }
  }
  return null;
}

function formatGateFailure(failure) {
  const location =
    failure.modeId && failure.scenarioId
      ? `${failure.modeId}:${failure.scenarioId}`
      : failure.scenarioId ?? "gate";
  const details = Object.entries(failure)
    .filter(([key]) => !["modeId", "scenarioId", "gateStatus"].includes(key))
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(" ");
  return details
    ? `${location} ${failure.gateStatus} ${details}`
    : `${location} ${failure.gateStatus}`;
}
