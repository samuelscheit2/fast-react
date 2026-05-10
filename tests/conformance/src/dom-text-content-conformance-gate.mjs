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

export const DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_HOST_TEXT_COMMIT_TARGET = {
  packageName: "@fast-react/react-dom",
  version: "0.0.0",
  role: "workspace-fast-react-private-dom-host-text-commit-helper",
  entrypoint:
    "packages/react-dom/src/dom-host/mutation.js#DOM_HOST_TEXT_COMMIT_GATE_METADATA"
};

export const DOM_TEXT_CONTENT_PRIVATE_SHOULD_SET_MATCH_STATUS =
  "matched-react-dom-19.2.6-private-should-set-text-content";

export const DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_SHOULD_SET_STATUS =
  "skipped-unsupported-private-text-content-slice";

export const DOM_TEXT_CONTENT_PRIVATE_HOST_TEXT_COMMIT_MATCH_STATUS =
  "matched-react-dom-19.2.6-private-host-text-commit-row";

export const DOM_TEXT_CONTENT_UNSUPPORTED_DOM_RENDER_STATUS =
  "skipped-unsupported-dom-mutation-root-path";

export const DOM_TEXT_CONTENT_UNSUPPORTED_TEXT_CONTENT_SCENARIO_STATUS =
  "skipped-unsupported-private-host-text-content-scenario";

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

export const DOM_TEXT_CONTENT_ADMITTED_PRIVATE_HOST_TEXT_COMMIT_ROWS =
  Object.freeze([
    {
      rowId: "host-text-create-append",
      scenarioId: "host-text-sibling-boundaries",
      phaseId: "initial",
      oracleExtractor: "host-text-sibling-create-append",
      localProbe: "host-text-create-append",
      coverage: ["host-text-creation", "appendChild"],
      reason:
        "The private mutation helper can append supplied fake-DOM HostText nodes; the gate creates deterministic fake text nodes locally without claiming ownerDocument text-instance creation."
    },
    {
      rowId: "host-text-update-node-value",
      scenarioId: "host-text-sibling-boundaries",
      phaseId: "update",
      oracleExtractor: "host-text-sibling-update-node-value",
      localProbe: "host-text-update-node-value",
      coverage: ["host-text-update", "commitTextUpdate"],
      reason:
        "The private mutation helper implements HostText node value commits over supplied fake-DOM text nodes."
    },
    {
      rowId: "host-text-delete-remove-child",
      scenarioId: "host-text-sibling-boundaries",
      phaseId: "delete-text-siblings",
      oracleExtractor: "host-text-sibling-delete-remove-child",
      localProbe: "host-text-delete-remove-child",
      coverage: ["host-text-deletion", "removeChild"],
      reason:
        "The private mutation helper implements fake-DOM text child removal from an explicit parent."
    },
    {
      rowId: "host-text-insert-before",
      scenarioId: "host-text-insertion-before-element",
      phaseId: "prepend-text",
      oracleExtractor: "host-text-insert-before",
      localProbe: "host-text-insert-before",
      coverage: ["host-text-creation", "host-text-insertion", "insertBefore"],
      reason:
        "The private mutation helper can insert a supplied fake-DOM HostText node before an existing sibling."
    },
    {
      rowId: "reset-text-content-before-managed-child",
      scenarioId: "text-content-to-managed-child-boundary",
      phaseId: "managed-child",
      oracleExtractor: "reset-text-content-before-managed-child",
      localProbe: "reset-text-content-before-managed-child",
      coverage: ["resetTextContent"],
      reason:
        "The private mutation helper implements the resetTextContent write used before appending managed children."
    }
  ]);

export const DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_HOST_TEXT_COMMIT_SCENARIOS =
  Object.freeze([
    {
      scenarioId: "primitive-text-content-shortcut",
      gateStatus: DOM_TEXT_CONTENT_UNSUPPORTED_TEXT_CONTENT_SCENARIO_STATUS,
      reason:
        "Element-owned primitive text-content shortcut updates are not HostText commit rows and remain outside this private HostText gate."
    },
    {
      scenarioId: "namespace-text-content-boundaries",
      gateStatus: DOM_TEXT_CONTENT_UNSUPPORTED_TEXT_CONTENT_SCENARIO_STATUS,
      reason:
        "Namespace-sensitive element creation and text updates remain outside the private fake-DOM HostText commit slice."
    },
    {
      scenarioId: "svg-container-text-root",
      gateStatus: DOM_TEXT_CONTENT_UNSUPPORTED_TEXT_CONTENT_SCENARIO_STATUS,
      reason:
        "SVG-container namespace context remains unsupported by this private HostText commit gate."
    },
    {
      scenarioId: "dangerous-html-exclusion-and-managed-text",
      gateStatus: DOM_TEXT_CONTENT_UNSUPPORTED_TEXT_CONTENT_SCENARIO_STATUS,
      reason:
        "dangerouslySetInnerHTML leaf behavior and managed-text transitions remain owned by the DOM property boundary gate."
    },
    {
      scenarioId: "dangerous-html-nullish-does-not-shortcut",
      gateStatus: DOM_TEXT_CONTENT_UNSUPPORTED_TEXT_CONTENT_SCENARIO_STATUS,
      reason:
        "Nullish dangerouslySetInnerHTML behavior is a text-content/property-boundary scenario, not an admitted HostText commit row."
    },
    {
      scenarioId: "dangerous-html-children-conflict",
      gateStatus: DOM_TEXT_CONTENT_UNSUPPORTED_TEXT_CONTENT_SCENARIO_STATUS,
      reason:
        "dangerouslySetInnerHTML children-conflict errors remain outside private HostText commit behavior."
    },
    {
      scenarioId: "dangerous-html-shape-validation",
      gateStatus: DOM_TEXT_CONTENT_UNSUPPORTED_TEXT_CONTENT_SCENARIO_STATUS,
      reason:
        "dangerouslySetInnerHTML shape validation remains outside private HostText commit behavior."
    }
  ]);

export const DOM_TEXT_CONTENT_CONFORMANCE_GATE = {
  id: DOM_TEXT_CONTENT_CONFORMANCE_GATE_ID,
  reactDomOracle: `${DOM_TEXT_CONTENT_TARGET.packageName}@${DOM_TEXT_CONTENT_TARGET.version}`,
  localTargetPackageName:
    DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_TEXT_CONTENT_TARGET.packageName,
  localEntrypoint:
    DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_TEXT_CONTENT_TARGET.entrypoint,
  localHostTextCommitEntrypoint:
    DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_HOST_TEXT_COMMIT_TARGET.entrypoint,
  admittedPrivateShouldSetScenarioIds:
    DOM_TEXT_CONTENT_ADMITTED_PRIVATE_SHOULD_SET_SCENARIO_IDS,
  unsupportedPrivateShouldSetScenarioIds:
    DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_SHOULD_SET_SCENARIOS.map(
      (scenario) => scenario.scenarioId
    ),
  admittedPrivateHostTextCommitRowIds:
    DOM_TEXT_CONTENT_ADMITTED_PRIVATE_HOST_TEXT_COMMIT_ROWS.map(
      (row) => row.rowId
    ),
  unsupportedPrivateHostTextCommitScenarioIds:
    DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_HOST_TEXT_COMMIT_SCENARIOS.map(
      (scenario) => scenario.scenarioId
    ),
  unsupportedDomRenderPaths: {
    gateStatus: DOM_TEXT_CONTENT_UNSUPPORTED_DOM_RENDER_STATUS,
    publicRootsCompared: false,
    serverSerializationCompared: false,
    clientMutationCompared: false,
    hydrationCompared: false,
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
  const localHostTextCommitObservations =
    runLocalDomHostTextCommitObservations({ workspaceRoot });

  return evaluateDomTextContentConformanceGate({
    checkedOracle,
    localChecks,
    localShouldSetTextContentObservations,
    localHostTextCommitObservations
  });
}

export function evaluateDomTextContentConformanceGate({
  checkedOracle,
  localChecks = inspectDomTextContentLocalTargets(),
  localShouldSetTextContentObservations,
  localHostTextCommitObservations
} = {}) {
  const failures = [];
  const admittedPrivateShouldSetRows = [];
  const admittedPrivateHostTextCommitRows = [];
  const skippedUnsupportedPrivateShouldSetRows = [];
  const skippedUnsupportedPrivateHostTextCommitScenarioRows = [];
  const skippedUnsupportedDomRenderRows = [];

  if (!checkedOracle) {
    failures.push({
      gateStatus: "missing-checked-dom-text-content-oracle"
    });
  }

  const localObservations =
    localShouldSetTextContentObservations ??
    runLocalDomTextContentShouldSetObservations();
  const localHostTextObservations =
    localHostTextCommitObservations ?? runLocalDomHostTextCommitObservations();
  const localObservationByScenario = new Map(
    localObservations.observations.map((observation) => [
      observation.scenarioId,
      observation
    ])
  );
  const localHostTextObservationByRow = new Map(
    localHostTextObservations.observations.map((observation) => [
      observation.rowId,
      observation
    ])
  );
  const shouldSetAdmissions = buildShouldSetAdmissionMap();

  validateOracleShape({ checkedOracle, failures });
  validateAdmissionMetadata({ shouldSetAdmissions, failures });
  validateHostTextCommitAdmissionMetadata({
    localHostTextObservations,
    failures
  });

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

  if (localHostTextObservations.loadError) {
    failures.push({
      gateStatus: "local-private-host-text-commit-load-failed",
      error: localHostTextObservations.loadError
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
      for (const admittedRow of DOM_TEXT_CONTENT_ADMITTED_PRIVATE_HOST_TEXT_COMMIT_ROWS) {
        const checkedRow = readExpectedHostTextCommitRowFromOracle({
          oracle: checkedOracle,
          modeId: mode.id,
          admittedRow
        });

        if (checkedRow.error) {
          failures.push({
            modeId: mode.id,
            rowId: admittedRow.rowId,
            scenarioId: admittedRow.scenarioId,
            phaseId: admittedRow.phaseId,
            gateStatus: "missing-react-dom-host-text-commit-row",
            error: checkedRow.error
          });
          continue;
        }

        const localObservation = localHostTextObservationByRow.get(
          admittedRow.rowId
        );
        if (!localObservation) {
          failures.push({
            modeId: mode.id,
            rowId: admittedRow.rowId,
            scenarioId: admittedRow.scenarioId,
            phaseId: admittedRow.phaseId,
            gateStatus: "missing-local-private-host-text-commit-observation"
          });
          continue;
        }

        const firstDifferencePath = findFirstDifferencePath(
          checkedRow.result,
          localObservation.result
        );
        if (firstDifferencePath === null) {
          admittedPrivateHostTextCommitRows.push({
            modeId: mode.id,
            rowId: admittedRow.rowId,
            scenarioId: admittedRow.scenarioId,
            phaseId: admittedRow.phaseId,
            gateStatus: DOM_TEXT_CONTENT_PRIVATE_HOST_TEXT_COMMIT_MATCH_STATUS
          });
        } else {
          failures.push({
            modeId: mode.id,
            rowId: admittedRow.rowId,
            scenarioId: admittedRow.scenarioId,
            phaseId: admittedRow.phaseId,
            gateStatus: "admitted-private-host-text-commit-output-mismatch",
            firstDifferencePath
          });
        }
      }
    }

    for (const scenario of DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_HOST_TEXT_COMMIT_SCENARIOS) {
      skippedUnsupportedPrivateHostTextCommitScenarioRows.push({
        scenarioId: scenario.scenarioId,
        gateStatus: scenario.gateStatus,
        reason: scenario.reason
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
              "The local gate compares only implemented private helper rows; public root rendering, full client mutation output, server rendering, hydration, and unsupported text-content scenarios remain unsupported."
          });
        }
      }
    }
  }

  if (
    skippedUnsupportedPrivateShouldSetRows.length > 0 ||
    skippedUnsupportedPrivateHostTextCommitScenarioRows.length > 0 ||
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
    localHostTextCommitObservationMetadata: localHostTextObservations.metadata,
    admittedPrivateShouldSetRows,
    admittedPrivateHostTextCommitRows,
    skippedUnsupportedPrivateShouldSetRows,
    skippedUnsupportedPrivateHostTextCommitScenarioRows,
    skippedUnsupportedDomRenderRows,
    failures,
    summary: {
      admittedPrivateShouldSetRowCount: admittedPrivateShouldSetRows.length,
      admittedPrivateHostTextCommitRowCount:
        admittedPrivateHostTextCommitRows.length,
      skippedUnsupportedPrivateShouldSetRowCount:
        skippedUnsupportedPrivateShouldSetRows.length,
      skippedUnsupportedPrivateHostTextCommitScenarioCount:
        skippedUnsupportedPrivateHostTextCommitScenarioRows.length,
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
      privateHostTextCommitBehaviorCompared:
        ok && admittedPrivateHostTextCommitRows.length > 0,
      fullDomTextContentCompatibilityAdmitted:
        ok &&
        skippedUnsupportedPrivateShouldSetRows.length === 0 &&
        skippedUnsupportedPrivateHostTextCommitScenarioRows.length === 0 &&
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

export function runLocalDomHostTextCommitObservations({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  const loadResult = loadLocalPrivateHostTextCommitHelper({ workspaceRoot });
  if (loadResult.error) {
    return {
      metadata: {
        target: DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_HOST_TEXT_COMMIT_TARGET,
        observationKind: "private-dom-host-text-commit",
        loaded: false,
        gateMetadata: null
      },
      loadError: loadResult.error,
      observations: []
    };
  }

  return {
    metadata: {
      target: DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_HOST_TEXT_COMMIT_TARGET,
      observationKind: "private-dom-host-text-commit",
      loaded: true,
      gateMetadata: loadResult.gateMetadata
    },
    loadError: null,
    observations: DOM_TEXT_CONTENT_ADMITTED_PRIVATE_HOST_TEXT_COMMIT_ROWS.map(
      (admittedRow) =>
        runLocalHostTextCommitProbe({
          admittedRow,
          mutation: loadResult.mutation
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
    `Admitted private HostText commit rows compared: ${result.summary.admittedPrivateHostTextCommitRowCount}`,
    `Skipped unsupported private shouldSetTextContent rows: ${result.summary.skippedUnsupportedPrivateShouldSetRowCount}`,
    `Skipped unsupported private HostText/text-content scenarios: ${result.summary.skippedUnsupportedPrivateHostTextCommitScenarioCount}`,
    `Skipped unsupported DOM render/mutation rows: ${result.summary.skippedUnsupportedDomRenderRowCount}`,
    `Failures: ${result.summary.failureCount}`
  ];

  if (
    result.skippedUnsupportedPrivateShouldSetRows.length > 0 ||
    result.skippedUnsupportedPrivateHostTextCommitScenarioRows.length > 0 ||
    result.skippedUnsupportedDomRenderRows.length > 0
  ) {
    lines.push(
      "Full DOM text-content compatibility remains blocked; unsupported private slices, public roots, server rendering, hydration, full DOM mutation output, and text-content scenarios are not admitted as passing behavior."
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

function validateHostTextCommitAdmissionMetadata({
  localHostTextObservations,
  failures
}) {
  const knownRenderScenarioIds = new Set(
    DOM_TEXT_CONTENT_RENDER_SCENARIOS.map((scenario) => scenario.id)
  );
  const admittedRowIds = DOM_TEXT_CONTENT_ADMITTED_PRIVATE_HOST_TEXT_COMMIT_ROWS.map(
    (row) => row.rowId
  );
  const supportedRowIds =
    localHostTextObservations.metadata.gateMetadata?.supportedFakeDomRowIds ??
    [];

  for (const admittedRow of DOM_TEXT_CONTENT_ADMITTED_PRIVATE_HOST_TEXT_COMMIT_ROWS) {
    if (!knownRenderScenarioIds.has(admittedRow.scenarioId)) {
      failures.push({
        rowId: admittedRow.rowId,
        scenarioId: admittedRow.scenarioId,
        gateStatus: "unknown-admitted-private-host-text-commit-scenario"
      });
    }

    if (!admittedRowIds.includes(admittedRow.rowId)) {
      failures.push({
        rowId: admittedRow.rowId,
        gateStatus: "unknown-admitted-private-host-text-commit-row"
      });
    }
  }

  for (const scenario of DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_HOST_TEXT_COMMIT_SCENARIOS) {
    if (!knownRenderScenarioIds.has(scenario.scenarioId)) {
      failures.push({
        scenarioId: scenario.scenarioId,
        gateStatus: "unknown-unsupported-private-host-text-commit-scenario"
      });
    }
  }

  const supportedDifference = findFirstDifferencePath(
    supportedRowIds,
    admittedRowIds
  );
  if (supportedDifference !== null) {
    failures.push({
      gateStatus: "local-host-text-commit-supported-row-metadata-mismatch",
      firstDifferencePath: supportedDifference,
      supportedRowIds,
      admittedRowIds
    });
  }

  const gateMetadata = localHostTextObservations.metadata.gateMetadata;
  for (const [key, expected] of [
    ["publicRootsCompared", false],
    ["serverRenderingCompared", false],
    ["hydrationCompared", false],
    ["browserDomCompared", false],
    ["compatibilityClaimed", false]
  ]) {
    if (gateMetadata?.[key] !== expected) {
      failures.push({
        gateStatus: `local-host-text-commit-metadata-${key}-mismatch`,
        value: gateMetadata?.[key] ?? null
      });
    }
  }
}

function readExpectedHostTextCommitRowFromOracle({
  oracle,
  modeId,
  admittedRow
}) {
  const observation = findRenderObservationOrNull({
    oracle,
    modeId,
    observationKind: "clientMutation",
    scenarioId: admittedRow.scenarioId
  });
  const phase = observation?.result?.phases?.find(
    (candidate) => candidate.phaseId === admittedRow.phaseId
  );

  if (!phase) {
    return {
      error: `Missing client mutation phase ${admittedRow.phaseId} for ${admittedRow.scenarioId}.`
    };
  }

  return normalizeExpectedHostTextCommitRow({ admittedRow, phase });
}

function normalizeExpectedHostTextCommitRow({ admittedRow, phase }) {
  switch (admittedRow.oracleExtractor) {
    case "host-text-sibling-create-append": {
      const createMutations = phase.mutations.filter(
        (mutation) =>
          mutation.type === "createTextNode" &&
          (mutation.value === "left" || mutation.value === "right")
      );
      const appendMutations = phase.mutations.filter(
        (mutation) =>
          mutation.type === "appendChild" &&
          mutation.parent === "DIV" &&
          mutation.child === "#text"
      );
      if (
        findFirstDifferencePath(
          createMutations.map((mutation) => mutation.value),
          ["left", "right"]
        ) !== null ||
        appendMutations.length !== 2
      ) {
        return {
          error:
            "React DOM host-text-sibling initial phase no longer has the expected left/right create and append mutations."
        };
      }
      return {
        result: {
          rowId: admittedRow.rowId,
          operation: admittedRow.localProbe,
          mutations: [
            ...createMutations.map(({ type, value }) => ({ type, value })),
            ...appendMutations.map(({ type, parent, child }) => ({
              type,
              parent,
              child
            }))
          ]
        }
      };
    }
    case "host-text-sibling-update-node-value": {
      const nodeValueMutations = phase.mutations.filter(
        (mutation) => mutation.type === "setNodeValue"
      );
      if (
        findFirstDifferencePath(
          nodeValueMutations.map((mutation) => mutation.value),
          ["left!", "middle!", "right!"]
        ) !== null
      ) {
        return {
          error:
            "React DOM host-text-sibling update phase no longer has the expected left/middle/right node-value writes."
        };
      }
      return {
        result: {
          rowId: admittedRow.rowId,
          operation: admittedRow.localProbe,
          mutations: [nodeValueMutations[0], nodeValueMutations[2]].map(
            ({ type, target, value }) => ({ type, target, value })
          )
        }
      };
    }
    case "host-text-sibling-delete-remove-child": {
      const removeMutations = phase.mutations.filter(
        (mutation) => mutation.type === "removeChild"
      );
      if (
        removeMutations.length !== 2 ||
        removeMutations.some(
          (mutation) =>
            mutation.parent !== "DIV" ||
            mutation.child !== "#text" ||
            mutation.found !== true
        )
      ) {
        return {
          error:
            "React DOM host-text-sibling delete phase no longer has the expected two text removals."
        };
      }
      return {
        result: {
          rowId: admittedRow.rowId,
          operation: admittedRow.localProbe,
          mutations: removeMutations.map(({ type, parent, child, found }) => ({
            type,
            parent,
            child,
            found
          }))
        }
      };
    }
    case "host-text-insert-before": {
      if (
        findFirstDifferencePath(
          phase.mutations,
          [
            {
              type: "createTextNode",
              value: "head"
            },
            {
              type: "insertBefore",
              parent: "DIV",
              child: "#text",
              before: "SPAN",
              beforeFound: true
            }
          ]
        ) !== null
      ) {
        return {
          error:
            "React DOM host-text insertion phase no longer has the expected createTextNode plus insertBefore mutations."
        };
      }
      return {
        result: {
          rowId: admittedRow.rowId,
          operation: admittedRow.localProbe,
          mutations: phase.mutations
        }
      };
    }
    case "reset-text-content-before-managed-child": {
      const resetMutation = phase.mutations.find(
        (mutation) =>
          mutation.type === "setTextContent" &&
          mutation.target === "SECTION" &&
          mutation.value === ""
      );
      if (!resetMutation) {
        return {
          error:
            "React DOM managed-child phase no longer records resetTextContent on SECTION before append."
        };
      }
      return {
        result: {
          rowId: admittedRow.rowId,
          operation: admittedRow.localProbe,
          mutations: [
            {
              type: resetMutation.type,
              target: resetMutation.target,
              value: resetMutation.value
            }
          ]
        }
      };
    }
    default:
      return {
        error: `Unknown HostText commit oracle extractor: ${admittedRow.oracleExtractor}`
      };
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

function loadLocalPrivateHostTextCommitHelper({ workspaceRoot }) {
  const modulePath = join(
    workspaceRoot,
    "packages/react-dom/src/dom-host/mutation.js"
  );

  try {
    const mutation = require(modulePath);
    for (const exportName of [
      "DOM_HOST_TEXT_COMMIT_GATE_METADATA",
      "appendChild",
      "insertBefore",
      "removeChild",
      "commitTextUpdate",
      "resetTextContent"
    ]) {
      if (mutation[exportName] == null) {
        return {
          error: {
            name: "TypeError",
            message: `Local private mutation module does not export ${exportName}`
          }
        };
      }
    }
    return {
      mutation,
      gateMetadata: mutation.DOM_HOST_TEXT_COMMIT_GATE_METADATA,
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

function runLocalHostTextCommitProbe({ admittedRow, mutation }) {
  try {
    return {
      rowId: admittedRow.rowId,
      scenarioId: admittedRow.scenarioId,
      phaseId: admittedRow.phaseId,
      action: "privateDomHostTextCommit",
      targetPackage:
        DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_HOST_TEXT_COMMIT_TARGET.packageName,
      entrypoint:
        DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_HOST_TEXT_COMMIT_TARGET.entrypoint,
      result: runLocalHostTextCommitOperation({ admittedRow, mutation })
    };
  } catch (error) {
    return {
      rowId: admittedRow.rowId,
      scenarioId: admittedRow.scenarioId,
      phaseId: admittedRow.phaseId,
      action: "privateDomHostTextCommit",
      targetPackage:
        DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_HOST_TEXT_COMMIT_TARGET.packageName,
      entrypoint:
        DOM_TEXT_CONTENT_FAST_REACT_PRIVATE_HOST_TEXT_COMMIT_TARGET.entrypoint,
      result: {
        rowId: admittedRow.rowId,
        operation: admittedRow.localProbe,
        status: "throws",
        error: describeThrown(error)
      }
    };
  }
}

function runLocalHostTextCommitOperation({ admittedRow, mutation }) {
  const document = new HostTextGateFakeDocument();

  switch (admittedRow.localProbe) {
    case "host-text-create-append": {
      const parent = document.createElement("div", { record: false });
      const left = document.createTextNode("left");
      const right = document.createTextNode("right");
      mutation.appendChild(parent, left);
      mutation.appendChild(parent, right);
      return {
        rowId: admittedRow.rowId,
        operation: admittedRow.localProbe,
        mutations: document.mutations
      };
    }
    case "host-text-update-node-value": {
      const left = document.createTextNode("left", { record: false });
      const right = document.createTextNode("right", { record: false });
      document.clearMutations();
      mutation.commitTextUpdate(left, "left", "left!");
      mutation.commitTextUpdate(right, "right", "right!");
      return {
        rowId: admittedRow.rowId,
        operation: admittedRow.localProbe,
        mutations: document.mutations
      };
    }
    case "host-text-delete-remove-child": {
      const parent = document.createElement("div", { record: false });
      const left = document.createTextNode("left", { record: false });
      const anchor = document.createElement("span", { record: false });
      const right = document.createTextNode("right", { record: false });
      parent.appendChild(left, { record: false });
      parent.appendChild(anchor, { record: false });
      parent.appendChild(right, { record: false });
      document.clearMutations();
      mutation.removeChild(parent, left);
      mutation.removeChild(parent, right);
      return {
        rowId: admittedRow.rowId,
        operation: admittedRow.localProbe,
        mutations: document.mutations
      };
    }
    case "host-text-insert-before": {
      const parent = document.createElement("div", { record: false });
      const anchor = document.createElement("span", { record: false });
      parent.appendChild(anchor, { record: false });
      document.clearMutations();
      const head = document.createTextNode("head");
      mutation.insertBefore(parent, head, anchor);
      return {
        rowId: admittedRow.rowId,
        operation: admittedRow.localProbe,
        mutations: document.mutations
      };
    }
    case "reset-text-content-before-managed-child": {
      const section = document.createElement("section", { record: false });
      const initialText = document.createTextNode("Plain text", {
        record: false
      });
      section.appendChild(initialText, { record: false });
      document.clearMutations();
      mutation.resetTextContent(section);
      return {
        rowId: admittedRow.rowId,
        operation: admittedRow.localProbe,
        mutations: document.mutations
      };
    }
    default:
      throw new Error(`Unknown local HostText commit probe: ${admittedRow.localProbe}`);
  }
}

class HostTextGateFakeDocument {
  constructor() {
    this.mutations = [];
  }

  createElement(tagName, { record = true } = {}) {
    return new HostTextGateFakeElement(tagName, this, { record });
  }

  createTextNode(text, { record = true } = {}) {
    if (record) {
      this.mutations.push({
        type: "createTextNode",
        value: String(text)
      });
    }
    return new HostTextGateFakeText(text, this);
  }

  clearMutations() {
    this.mutations.length = 0;
  }

  recordAppendChild(parent, child) {
    this.mutations.push({
      type: "appendChild",
      parent: parent.nodeName,
      child: child.nodeName
    });
  }

  recordInsertBefore(parent, child, beforeChild, beforeFound) {
    this.mutations.push({
      type: "insertBefore",
      parent: parent.nodeName,
      child: child.nodeName,
      before: beforeChild.nodeName,
      beforeFound
    });
  }

  recordRemoveChild(parent, child, found) {
    this.mutations.push({
      type: "removeChild",
      parent: parent.nodeName,
      child: child.nodeName,
      found
    });
  }

  recordSetTextContent(node, value) {
    this.mutations.push({
      type: "setTextContent",
      target: node.nodeName,
      value: String(value)
    });
  }

  recordSetNodeValue(node, value) {
    this.mutations.push({
      type: "setNodeValue",
      target: node.nodeName,
      value: String(value)
    });
  }
}

class HostTextGateFakeNode {
  constructor(nodeName, nodeType, ownerDocument) {
    this.childNodes = [];
    this.nodeName = nodeName;
    this.nodeType = nodeType;
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
  }

  get firstChild() {
    return this.childNodes[0] || null;
  }

  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || null;
  }

  appendChild(child, { record = true } = {}) {
    assertHostTextGateFakeChild(child);
    detachHostTextGateFakeNode(child);
    this.childNodes.push(child);
    child.parentNode = this;
    if (record) {
      this.ownerDocument.recordAppendChild(this, child);
    }
    return child;
  }

  insertBefore(child, beforeChild) {
    assertHostTextGateFakeChild(child);
    const beforeIndex = this.childNodes.indexOf(beforeChild);
    if (beforeIndex === -1) {
      this.ownerDocument.recordInsertBefore(this, child, beforeChild, false);
      throw new Error("Cannot insert before a node outside the parent.");
    }
    detachHostTextGateFakeNode(child);
    this.childNodes.splice(beforeIndex, 0, child);
    child.parentNode = this;
    this.ownerDocument.recordInsertBefore(this, child, beforeChild, true);
    return child;
  }

  removeChild(child) {
    const childIndex = this.childNodes.indexOf(child);
    if (childIndex === -1) {
      this.ownerDocument.recordRemoveChild(this, child, false);
      throw new Error("Cannot remove a node outside the parent.");
    }
    this.childNodes.splice(childIndex, 1);
    child.parentNode = null;
    this.ownerDocument.recordRemoveChild(this, child, true);
    return child;
  }
}

class HostTextGateFakeElement extends HostTextGateFakeNode {
  constructor(tagName, ownerDocument, { record = true } = {}) {
    super(tagName.toUpperCase(), 1, ownerDocument);
    this._textContent = "";
    if (record) {
      ownerDocument.mutations.push({
        type: "createElement",
        tagName
      });
    }
  }

  get textContent() {
    if (this.childNodes.length === 0) {
      return this._textContent;
    }
    return this.childNodes.map((child) => child.textContent).join("");
  }

  set textContent(value) {
    this.ownerDocument.recordSetTextContent(this, value);
    for (const child of [...this.childNodes]) {
      detachHostTextGateFakeNode(child);
    }
    this._textContent = String(value);
    if (this._textContent !== "") {
      this.appendChild(this.ownerDocument.createTextNode(this._textContent));
    }
  }
}

class HostTextGateFakeText extends HostTextGateFakeNode {
  constructor(text, ownerDocument) {
    super("#text", 3, ownerDocument);
    this._text = String(text);
  }

  get data() {
    return this._text;
  }

  set data(value) {
    this.nodeValue = value;
  }

  get nodeValue() {
    return this._text;
  }

  set nodeValue(value) {
    this._text = String(value);
    this.ownerDocument.recordSetNodeValue(this, this._text);
  }

  get textContent() {
    return this._text;
  }

  set textContent(value) {
    this.nodeValue = value;
  }
}

function assertHostTextGateFakeChild(child) {
  if (child == null || typeof child !== "object") {
    throw new Error("Fake DOM child must be an object.");
  }
}

function detachHostTextGateFakeNode(child) {
  if (child.parentNode === null) {
    return;
  }
  const siblings = child.parentNode.childNodes;
  const index = siblings.indexOf(child);
  if (index !== -1) {
    siblings.splice(index, 1);
  }
  child.parentNode = null;
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
