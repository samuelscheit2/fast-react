import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  readCheckedReactDomClientRootOracle
} from "./react-dom-client-root-oracle.mjs";
import {
  REACT_DOM_CLIENT_ROOT_SCENARIO_IDS
} from "./react-dom-client-root-scenarios.mjs";
import {
  REACT_DOM_CLIENT_ROOT_FAST_REACT_TARGET,
  REACT_DOM_CLIENT_ROOT_PROBE_MODES,
  REACT_DOM_CLIENT_ROOT_TARGET
} from "./react-dom-client-root-targets.mjs";
import {
  generateReactDomRootRenderE2EOracle
} from "./react-dom-root-render-e2e-oracle-generator.mjs";
import {
  readCheckedReactDomRootRenderE2EOracle
} from "./react-dom-root-render-e2e-oracle.mjs";
import {
  REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS
} from "./react-dom-root-render-e2e-scenarios.mjs";
import {
  REACT_DOM_ROOT_RENDER_E2E_CONFORMANCE_GATE,
  REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET,
  REACT_DOM_ROOT_RENDER_E2E_LOCAL_FAST_REACT_BEHAVIOR,
  REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES,
  REACT_DOM_ROOT_RENDER_E2E_TARGET
} from "./react-dom-root-render-e2e-targets.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);
const require = createRequire(import.meta.url);

export const REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_GATE_ID =
  "react-dom-root-public-facade-blocked-gate-1";

export const REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS =
  "blocked-public-root-facade-placeholder";

export const REACT_DOM_ROOT_PUBLIC_FACADE_BRIDGE_RECORD_ONLY_STATUS =
  "blocked-private-root-bridge-record-only";

export const REACT_DOM_ROOT_PUBLIC_FACADE_SCENARIO_ADMISSIONS = Object.freeze(
  REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.map((scenarioId) =>
    Object.freeze({
      scenarioId,
      admission: "blocked",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      comparedToAcceptedReactDomOracle: true,
      publicCompatibilityClaimed: false,
      reason:
        "Public React DOM root facade behavior stays blocked until createRoot, render, unmount, listener setup, DOM mutation, and root-bridge execution are wired through accepted runtime paths."
    })
  )
);

export const REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_BOUNDARY_ROWS =
  Object.freeze([
    Object.freeze({
      id: "public-create-root",
      publicApi: "react-dom/client.createRoot",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false
    }),
    Object.freeze({
      id: "public-hydrate-root",
      publicApi: "react-dom/client.hydrateRoot",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false
    }),
    Object.freeze({
      id: "public-root-render",
      publicApi: "root.render",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false
    }),
    Object.freeze({
      id: "public-root-unmount",
      publicApi: "root.unmount",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false
    }),
    Object.freeze({
      id: "public-dom-mutation",
      publicApi: "DOM mutation through public roots",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false
    }),
    Object.freeze({
      id: "public-listener-setup",
      publicApi: "root listener setup through public roots",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false
    }),
    Object.freeze({
      id: "public-compatibility-claim",
      publicApi: "React DOM root compatibility claim",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false
    })
  ]);

export const REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_GATE = Object.freeze({
  id: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_GATE_ID,
  reactDomClientRootOracle: `${REACT_DOM_CLIENT_ROOT_TARGET.packageName}@${REACT_DOM_CLIENT_ROOT_TARGET.version}`,
  reactDomRootRenderE2EOracle: `${REACT_DOM_ROOT_RENDER_E2E_TARGET.packageName}@${REACT_DOM_ROOT_RENDER_E2E_TARGET.version}`,
  localTargetPackageName: REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET.packageName,
  scenarioAdmissions: REACT_DOM_ROOT_PUBLIC_FACADE_SCENARIO_ADMISSIONS,
  blockedBoundaryRows: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_BOUNDARY_ROWS,
  unsupportedBehavior: Object.freeze({
    publicFacadeStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
    privateBridgeStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BRIDGE_RECORD_ONLY_STATUS,
    compatibilityClaimed: false
  })
});

export async function runReactDomRootRenderE2EConformanceGate({
  checkedOracle = readCheckedReactDomRootRenderE2EOracle(),
  currentOracle
} = {}) {
  return evaluateReactDomRootRenderE2EConformanceGate({
    checkedOracle,
    currentOracle: currentOracle ?? (await generateReactDomRootRenderE2EOracle())
  });
}

export async function runReactDomRootPublicFacadeBlockedGate({
  checkedOracle = readCheckedReactDomRootRenderE2EOracle(),
  currentOracle,
  clientRootOracle = readCheckedReactDomClientRootOracle(),
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  const resolvedCurrentOracle =
    currentOracle ?? (await generateReactDomRootRenderE2EOracle());

  return evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle,
    currentOracle: resolvedCurrentOracle,
    clientRootOracle,
    localPublicFacadeBoundary: inspectReactDomRootPublicFacadeBoundary({
      workspaceRoot
    }),
    privateRootBridgeBoundary: inspectReactDomPrivateRootBridgeBoundary({
      workspaceRoot
    })
  });
}

export function evaluateReactDomRootRenderE2EConformanceGate({
  checkedOracle,
  currentOracle
}) {
  const failures = [];
  const admitted = [];
  const blocked = [];
  const behaviorByScenario = new Map(
    REACT_DOM_ROOT_RENDER_E2E_LOCAL_FAST_REACT_BEHAVIOR.map((behavior) => [
      behavior.scenarioId,
      behavior
    ])
  );

  validateOracleShape({
    checkedOracle,
    currentOracle,
    failures
  });
  validateLocalFastReactBehavior({
    behaviorByScenario,
    failures
  });

  for (const mode of REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES) {
    for (const scenarioId of REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS) {
      const behavior = behaviorByScenario.get(scenarioId);
      const context = {
        modeId: mode.id,
        scenarioId
      };

      if (!behavior) {
        failures.push({
          ...context,
          gateStatus: "missing-local-fast-react-behavior"
        });
        continue;
      }

      const checkedReactObservation = findObservation({
        oracle: checkedOracle,
        modeId: mode.id,
        packageName: REACT_DOM_ROOT_RENDER_E2E_TARGET.packageName,
        scenarioId
      });
      const currentFastReactObservation = findObservation({
        oracle: currentOracle,
        modeId: mode.id,
        packageName: REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET.packageName,
        scenarioId
      });
      const currentComparison = findComparison({
        oracle: currentOracle,
        modeId: mode.id,
        scenarioId
      });

      if (!checkedReactObservation || !currentFastReactObservation) {
        failures.push({
          ...context,
          gateStatus: "missing-required-observation",
          checkedReactDomObservationFound: Boolean(checkedReactObservation),
          currentFastReactObservationFound: Boolean(currentFastReactObservation)
        });
        continue;
      }

      if (behavior.admission === "admitted") {
        const firstDifferencePath = findFirstDifferencePath(
          comparableProbeResult(checkedReactObservation.result),
          comparableProbeResult(currentFastReactObservation.result)
        );
        if (firstDifferencePath === null) {
          admitted.push({
            ...context,
            gateStatus: "matched-react-dom-19.2.6-oracle"
          });
        } else {
          failures.push({
            ...context,
            gateStatus: "admitted-local-output-mismatch",
            firstDifferencePath
          });
        }
        continue;
      }

      if (behavior.admission !== "unsupported") {
        failures.push({
          ...context,
          gateStatus: "unknown-local-fast-react-admission",
          admission: behavior.admission
        });
        continue;
      }

      if (!currentComparison) {
        failures.push({
          ...context,
          gateStatus: "missing-fast-react-comparison",
          expectedComparisonStatus: behavior.expectedComparisonStatus
        });
        continue;
      }

      if (
        currentComparison.status === behavior.expectedComparisonStatus &&
        currentComparison.compatibilityClaimed === false
      ) {
        blocked.push({
          ...context,
          gateStatus: behavior.gateStatus,
          comparisonStatus: currentComparison.status
        });
      } else {
        failures.push({
          ...context,
          gateStatus: "unsupported-local-output-not-fail-closed",
          expectedComparisonStatus: behavior.expectedComparisonStatus,
          actualComparisonStatus: currentComparison.status ?? null,
          compatibilityClaimed: currentComparison.compatibilityClaimed ?? null
        });
      }
    }
  }

  if (blocked.length > 0) {
    rejectCompatibilityClaimsWhileBlocked({
      checkedOracle,
      currentOracle,
      failures
    });
  }

  return {
    gate: REACT_DOM_ROOT_RENDER_E2E_CONFORMANCE_GATE,
    ok: failures.length === 0,
    admittedScenarioModeRows: admitted,
    blockedScenarioModeRows: blocked,
    failures,
    summary: {
      admittedScenarioModeRowCount: admitted.length,
      blockedScenarioModeRowCount: blocked.length,
      failureCount: failures.length,
      totalScenarioModeRowCount:
        REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length *
        REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length,
      compatibilityAdmitted:
        failures.length === 0 &&
        blocked.length === 0 &&
        admitted.length > 0,
      compatibilityClaimed: false
    }
  };
}

export function evaluateReactDomRootPublicFacadeBlockedGate({
  checkedOracle,
  currentOracle,
  clientRootOracle,
  localPublicFacadeBoundary = inspectReactDomRootPublicFacadeBoundary(),
  privateRootBridgeBoundary = inspectReactDomPrivateRootBridgeBoundary()
} = {}) {
  const failures = [];
  const blockedScenarioModeRows = [];
  const blockedPublicFacadeRows = [];
  const blockedPrivateBridgeRows = [];

  const rootRenderGateResult =
    checkedOracle && currentOracle
      ? evaluateReactDomRootRenderE2EConformanceGate({
          checkedOracle,
          currentOracle
        })
      : null;

  validateClientRootOraclePrerequisites({
    clientRootOracle,
    failures
  });
  validateRootRenderGatePrerequisites({
    rootRenderGateResult,
    failures
  });
  validatePublicFacadeScenarioAdmissions({
    currentOracle,
    blockedScenarioModeRows,
    failures
  });
  validatePublicFacadeBoundary({
    localPublicFacadeBoundary,
    blockedPublicFacadeRows,
    failures
  });
  validatePrivateRootBridgeBoundary({
    privateRootBridgeBoundary,
    blockedPrivateBridgeRows,
    failures
  });

  if (
    blockedScenarioModeRows.length > 0 ||
    blockedPublicFacadeRows.length > 0 ||
    blockedPrivateBridgeRows.length > 0
  ) {
    if (checkedOracle && currentOracle) {
      rejectCompatibilityClaimsWhileBlocked({
        checkedOracle,
        currentOracle,
        failures
      });
    }
    rejectClientRootCompatibilityClaimsWhileBlocked({
      clientRootOracle,
      failures
    });
  }

  return {
    gate: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_GATE,
    ok: failures.length === 0,
    rootRenderGate: rootRenderGateResult
      ? {
          ok: rootRenderGateResult.ok,
          summary: rootRenderGateResult.summary
        }
      : null,
    blockedScenarioModeRows,
    blockedPublicFacadeRows,
    blockedPrivateBridgeRows,
    localPublicFacadeBoundary,
    privateRootBridgeBoundary,
    failures,
    summary: {
      acceptedClientRootScenarioModeRowCount:
        REACT_DOM_CLIENT_ROOT_SCENARIO_IDS.length *
        REACT_DOM_CLIENT_ROOT_PROBE_MODES.length,
      acceptedRootRenderScenarioModeRowCount:
        REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length *
        REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length,
      blockedScenarioModeRowCount: blockedScenarioModeRows.length,
      blockedPublicFacadeRowCount: blockedPublicFacadeRows.length,
      blockedPrivateBridgeRowCount: blockedPrivateBridgeRows.length,
      failureCount: failures.length,
      compatibilityAdmitted: false,
      compatibilityClaimed: false
    }
  };
}

export function formatReactDomRootRenderE2EConformanceGateResult(result) {
  const lines = [
    `React DOM root render E2E conformance gate: ${result.ok ? "PASS" : "FAIL"}`,
    `Gate: ${result.gate.id}`,
    `React oracle: ${result.gate.reactDomOracle}`,
    `Local target: ${result.gate.localTargetPackageName}`,
    `Admitted scenario-mode rows compared: ${result.summary.admittedScenarioModeRowCount}`,
    `Blocked unsupported scenario-mode rows: ${result.summary.blockedScenarioModeRowCount}`,
    `Failures: ${result.summary.failureCount}`
  ];

  if (result.blockedScenarioModeRows.length > 0) {
    lines.push(
      "Compatibility remains blocked; unsupported local rows are not admitted as passing root E2E behavior."
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

export function formatReactDomRootPublicFacadeBlockedGateResult(result) {
  const lines = [
    `React DOM root public facade blocked gate: ${result.ok ? "PASS" : "FAIL"}`,
    `Gate: ${result.gate.id}`,
    `Client-root oracle: ${result.gate.reactDomClientRootOracle}`,
    `Root render E2E oracle: ${result.gate.reactDomRootRenderE2EOracle}`,
    `Local target: ${result.gate.localTargetPackageName}`,
    `Accepted client-root scenario-mode rows checked: ${result.summary.acceptedClientRootScenarioModeRowCount}`,
    `Accepted root-render scenario-mode rows checked: ${result.summary.acceptedRootRenderScenarioModeRowCount}`,
    `Blocked root-render scenario-mode rows: ${result.summary.blockedScenarioModeRowCount}`,
    `Blocked public facade rows: ${result.summary.blockedPublicFacadeRowCount}`,
    `Blocked private bridge rows: ${result.summary.blockedPrivateBridgeRowCount}`,
    `Failures: ${result.summary.failureCount}`
  ];

  if (result.summary.blockedPublicFacadeRowCount > 0) {
    lines.push(
      "Compatibility remains blocked; public createRoot/hydrateRoot/root lifecycle behavior is still placeholder-only."
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

export function inspectReactDomRootPublicFacadeBoundary({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  try {
    const reactDomClient = require(
      join(workspaceRoot, "packages/react-dom/client.js")
    );
    const rootMarkers = require(
      join(workspaceRoot, "packages/react-dom/src/client/root-markers.js")
    );
    const listenerRegistry = require(
      join(workspaceRoot, "packages/react-dom/src/events/listener-registry.js")
    );
    const domContainer = require(
      join(workspaceRoot, "packages/react-dom/src/client/dom-container.js")
    );

    const createRootDocument = createGateDocument(
      "public-create-root",
      domContainer
    );
    const createRootContainer = createGateElement(
      "DIV",
      createRootDocument,
      domContainer
    );
    const hydrateRootDocument = createGateDocument(
      "public-hydrate-root",
      domContainer
    );
    const hydrateRootContainer = createGateElement(
      "DIV",
      hydrateRootDocument,
      domContainer
    );

    const createRoot = attemptRootFacadeOperation(
      "react-dom/client.createRoot",
      () => reactDomClient.createRoot(createRootContainer),
      createRootContainer,
      createRootDocument,
      rootMarkers,
      listenerRegistry
    );
    const hydrateRoot = attemptRootFacadeOperation(
      "react-dom/client.hydrateRoot",
      () => reactDomClient.hydrateRoot(hydrateRootContainer, null),
      hydrateRootContainer,
      hydrateRootDocument,
      rootMarkers,
      listenerRegistry
    );

    return {
      loadError: null,
      exportKeys: Object.keys(reactDomClient),
      placeholderMetadata: {
        placeholder: reactDomClient.__FAST_REACT_PLACEHOLDER__ === true,
        entrypoint: reactDomClient.__FAST_REACT_ENTRYPOINT__ ?? null,
        compatibilityTarget: reactDomClient.compatibilityTarget ?? null
      },
      createRootExport: describeLocalFunction(reactDomClient.createRoot),
      hydrateRootExport: describeLocalFunction(reactDomClient.hydrateRoot),
      createRoot,
      hydrateRoot
    };
  } catch (error) {
    return {
      loadError: serializeGateError(error)
    };
  }
}

export function inspectReactDomPrivateRootBridgeBoundary({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  try {
    const rootBridge = require(
      join(workspaceRoot, "packages/react-dom/src/client/root-bridge.js")
    );
    const rootMarkers = require(
      join(workspaceRoot, "packages/react-dom/src/client/root-markers.js")
    );
    const listenerRegistry = require(
      join(workspaceRoot, "packages/react-dom/src/events/listener-registry.js")
    );
    const domContainer = require(
      join(workspaceRoot, "packages/react-dom/src/client/dom-container.js")
    );

    const document = createGateDocument("private-root-bridge", domContainer);
    const container = createGateElement("DIV", document, domContainer);
    const bridge = rootBridge.createPrivateRootBridgeShell({
      requestIdPrefix: "gate-request",
      rootIdPrefix: "gate-root",
      updateIdPrefix: "gate-update"
    });
    const element = {
      props: {
        children: "hello"
      },
      type: "span"
    };

    const create = bridge.createClientRoot(container, {
      identifierPrefix: "gate-"
    });
    const render = bridge.renderContainer(create.handle, element);
    const unmount = bridge.unmountContainer(create.handle);
    const secondUnmount = bridge.unmountContainer(create.handle);
    const renderAfterUnmount = attemptGateOperation("root.render after unmount", () =>
      bridge.renderContainer(create.handle, element)
    );

    return {
      loadError: null,
      create: summarizePrivateRootBridgeCreateRecord(create),
      render: summarizePrivateRootBridgeUpdateRecord(render),
      unmount: summarizePrivateRootBridgeUpdateRecord(unmount),
      secondUnmount: summarizePrivateRootBridgeUpdateRecord(secondUnmount),
      renderAfterUnmount,
      payloadsHidden: {
        createContainer:
          rootBridge.getPrivateRootRecordPayload(create)?.container === container,
        renderElement:
          rootBridge.getPrivateRootRecordPayload(render)?.element === element,
        unmountElement:
          rootBridge.getPrivateRootRecordPayload(unmount)?.element === null
      },
      sideEffects: inspectRootFacadeSideEffects(
        container,
        document,
        rootMarkers,
        listenerRegistry
      )
    };
  } catch (error) {
    return {
      loadError: serializeGateError(error)
    };
  }
}

function validateClientRootOraclePrerequisites({
  clientRootOracle,
  failures
}) {
  if (!clientRootOracle) {
    failures.push({
      gateStatus: "missing-client-root-oracle"
    });
    return;
  }

  if (
    clientRootOracle.oracleKind !==
    "react-19.2.6-react-dom-client-root-oracle"
  ) {
    failures.push({
      gateStatus: "client-root-oracle-kind-mismatch",
      oracleKind: clientRootOracle.oracleKind ?? null
    });
  }
  if (
    clientRootOracle.reactDomTarget?.packageName !==
      REACT_DOM_CLIENT_ROOT_TARGET.packageName ||
    clientRootOracle.reactDomTarget?.version !==
      REACT_DOM_CLIENT_ROOT_TARGET.version
  ) {
    failures.push({
      gateStatus: "client-root-react-dom-target-mismatch",
      target: clientRootOracle.reactDomTarget ?? null
    });
  }
  if (
    clientRootOracle.fastReactTarget?.packageName !==
    REACT_DOM_CLIENT_ROOT_FAST_REACT_TARGET.packageName
  ) {
    failures.push({
      gateStatus: "client-root-fast-react-target-mismatch",
      target: clientRootOracle.fastReactTarget ?? null
    });
  }
  if (
    findFirstDifferencePath(
      clientRootOracle.scenarios?.map((scenario) => scenario.id),
      REACT_DOM_CLIENT_ROOT_SCENARIO_IDS
    ) !== null
  ) {
    failures.push({
      gateStatus: "client-root-scenario-ids-mismatch"
    });
  }

  for (const mode of REACT_DOM_CLIENT_ROOT_PROBE_MODES) {
    const reactObservationCount =
      clientRootOracle.reactDomObservations?.[mode.id]?.length ?? 0;
    const fastReactComparisonCount =
      clientRootOracle.fastReactComparisons?.[mode.id]?.length ?? 0;
    if (reactObservationCount !== REACT_DOM_CLIENT_ROOT_SCENARIO_IDS.length) {
      failures.push({
        modeId: mode.id,
        gateStatus: "client-root-react-dom-observation-count-mismatch",
        actual: reactObservationCount,
        expected: REACT_DOM_CLIENT_ROOT_SCENARIO_IDS.length
      });
    }
    if (fastReactComparisonCount !== REACT_DOM_CLIENT_ROOT_SCENARIO_IDS.length) {
      failures.push({
        modeId: mode.id,
        gateStatus: "client-root-fast-react-comparison-count-mismatch",
        actual: fastReactComparisonCount,
        expected: REACT_DOM_CLIENT_ROOT_SCENARIO_IDS.length
      });
    }
  }

  rejectClientRootCompatibilityClaimsWhileBlocked({
    clientRootOracle,
    failures
  });
}

function validateRootRenderGatePrerequisites({
  rootRenderGateResult,
  failures
}) {
  if (!rootRenderGateResult) {
    failures.push({
      gateStatus: "missing-root-render-e2e-gate-result"
    });
    return;
  }
  if (!rootRenderGateResult.ok) {
    failures.push({
      gateStatus: "root-render-e2e-gate-failed-before-public-facade-check",
      failureCount: rootRenderGateResult.failures.length
    });
  }
  if (rootRenderGateResult.summary.admittedScenarioModeRowCount !== 0) {
    failures.push({
      gateStatus: "root-render-e2e-admitted-before-public-facade-unblocked",
      admittedScenarioModeRowCount:
        rootRenderGateResult.summary.admittedScenarioModeRowCount
    });
  }

  const expectedBlockedRows =
    REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length *
    REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length;
  if (rootRenderGateResult.summary.blockedScenarioModeRowCount !== expectedBlockedRows) {
    failures.push({
      gateStatus: "root-render-e2e-blocked-row-count-mismatch",
      actual: rootRenderGateResult.summary.blockedScenarioModeRowCount,
      expected: expectedBlockedRows
    });
  }
  if (
    rootRenderGateResult.summary.compatibilityAdmitted !== false ||
    rootRenderGateResult.summary.compatibilityClaimed !== false
  ) {
    failures.push({
      gateStatus: "root-render-e2e-claims-compatibility-while-public-facade-blocked",
      compatibilityAdmitted:
        rootRenderGateResult.summary.compatibilityAdmitted ?? null,
      compatibilityClaimed:
        rootRenderGateResult.summary.compatibilityClaimed ?? null
    });
  }
}

function validatePublicFacadeScenarioAdmissions({
  currentOracle,
  blockedScenarioModeRows,
  failures
}) {
  const admissionByScenario = new Map(
    REACT_DOM_ROOT_PUBLIC_FACADE_SCENARIO_ADMISSIONS.map((admission) => [
      admission.scenarioId,
      admission
    ])
  );

  for (const scenarioId of REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS) {
    const admission = admissionByScenario.get(scenarioId);
    if (!admission) {
      failures.push({
        scenarioId,
        gateStatus: "missing-public-facade-scenario-admission"
      });
      continue;
    }
    if (
      admission.admission !== "blocked" ||
      admission.publicCompatibilityClaimed !== false
    ) {
      failures.push({
        scenarioId,
        gateStatus: "public-facade-scenario-admission-not-blocked",
        admission: admission.admission,
        publicCompatibilityClaimed:
          admission.publicCompatibilityClaimed ?? null
      });
    }
  }

  for (const admission of REACT_DOM_ROOT_PUBLIC_FACADE_SCENARIO_ADMISSIONS) {
    if (!REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.includes(admission.scenarioId)) {
      failures.push({
        scenarioId: admission.scenarioId,
        gateStatus: "unknown-public-facade-scenario-admission"
      });
    }
  }

  if (!currentOracle) {
    failures.push({
      gateStatus: "missing-current-root-render-e2e-oracle"
    });
    return;
  }

  for (const mode of REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES) {
    for (const scenarioId of REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS) {
      const comparison = findComparison({
        oracle: currentOracle,
        modeId: mode.id,
        scenarioId
      });
      if (!comparison) {
        failures.push({
          modeId: mode.id,
          scenarioId,
          gateStatus: "missing-current-root-render-comparison-for-public-facade"
        });
        continue;
      }
      if (
        comparison.status === "unsupported-placeholder" &&
        comparison.compatibilityClaimed === false &&
        comparison.firstDifferencePath !== null
      ) {
        blockedScenarioModeRows.push({
          modeId: mode.id,
          scenarioId,
          gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
          comparisonStatus: comparison.status
        });
      } else {
        failures.push({
          modeId: mode.id,
          scenarioId,
          gateStatus: "root-render-comparison-not-blocked-for-public-facade",
          status: comparison.status ?? null,
          compatibilityClaimed: comparison.compatibilityClaimed ?? null,
          firstDifferencePath: comparison.firstDifferencePath ?? null
        });
      }
    }
  }
}

function validatePublicFacadeBoundary({
  localPublicFacadeBoundary,
  blockedPublicFacadeRows,
  failures
}) {
  if (localPublicFacadeBoundary.loadError) {
    failures.push({
      gateStatus: "local-public-root-facade-load-failed",
      error: localPublicFacadeBoundary.loadError
    });
    return;
  }

  if (
    findFirstDifferencePath(localPublicFacadeBoundary.exportKeys, [
      "createRoot",
      "hydrateRoot",
      "version"
    ]) !== null
  ) {
    failures.push({
      gateStatus: "local-public-root-facade-export-keys-mismatch",
      exportKeys: localPublicFacadeBoundary.exportKeys
    });
  }
  if (
    localPublicFacadeBoundary.placeholderMetadata.placeholder !== true ||
    localPublicFacadeBoundary.placeholderMetadata.entrypoint !==
      "react-dom/client" ||
    localPublicFacadeBoundary.placeholderMetadata.compatibilityTarget !==
      "react-dom@19.2.6"
  ) {
    failures.push({
      gateStatus: "local-public-root-facade-placeholder-metadata-mismatch",
      placeholderMetadata: localPublicFacadeBoundary.placeholderMetadata
    });
  }

  validatePublicRootExportBlocked({
    exportName: "createRoot",
    operation: localPublicFacadeBoundary.createRoot,
    exportInfo: localPublicFacadeBoundary.createRootExport,
    blockedPublicFacadeRows,
    failures
  });
  validatePublicRootExportBlocked({
    exportName: "hydrateRoot",
    operation: localPublicFacadeBoundary.hydrateRoot,
    exportInfo: localPublicFacadeBoundary.hydrateRootExport,
    blockedPublicFacadeRows,
    failures
  });

  if (localPublicFacadeBoundary.createRoot.rootObjectCreated === false) {
    blockedPublicFacadeRows.push({
      id: "public-root-render",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      reason: "root.render is unreachable because public createRoot is blocked."
    });
    blockedPublicFacadeRows.push({
      id: "public-root-unmount",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      reason: "root.unmount is unreachable because public createRoot is blocked."
    });
  } else {
    failures.push({
      gateStatus: "public-root-object-created-while-facade-blocked",
      createRoot: localPublicFacadeBoundary.createRoot
    });
  }

  const createRootSideEffects = localPublicFacadeBoundary.createRoot.sideEffects;
  const hydrateRootSideEffects = localPublicFacadeBoundary.hydrateRoot.sideEffects;
  if (
    isRootFacadeSideEffectFree(createRootSideEffects) &&
    isRootFacadeSideEffectFree(hydrateRootSideEffects)
  ) {
    blockedPublicFacadeRows.push({
      id: "public-dom-mutation",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      mutationCount:
        createRootSideEffects.mutationCount +
        hydrateRootSideEffects.mutationCount
    });
    blockedPublicFacadeRows.push({
      id: "public-listener-setup",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      listenerRegistrationCount:
        createRootSideEffects.listenerRegistrationCount +
        hydrateRootSideEffects.listenerRegistrationCount
    });
  } else {
    failures.push({
      gateStatus: "public-root-facade-produced-side-effects",
      createRootSideEffects,
      hydrateRootSideEffects
    });
  }

  blockedPublicFacadeRows.push({
    id: "public-compatibility-claim",
    gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
    compatibilityClaimed: false
  });
}

function validatePublicRootExportBlocked({
  exportName,
  operation,
  exportInfo,
  blockedPublicFacadeRows,
  failures
}) {
  if (
    exportInfo.type !== "function" ||
    exportInfo.name !== exportName ||
    exportInfo.length !== 0
  ) {
    failures.push({
      gateStatus: "public-root-export-shape-mismatch",
      exportName,
      exportInfo
    });
  }

  if (
    operation.status === "throws" &&
    operation.thrown.code === "FAST_REACT_UNIMPLEMENTED" &&
    operation.thrown.entrypoint === "react-dom/client" &&
    operation.thrown.exportName === exportName &&
    operation.rootObjectCreated === false &&
    isRootFacadeSideEffectFree(operation.sideEffects)
  ) {
    blockedPublicFacadeRows.push({
      id: `public-${exportName === "createRoot" ? "create-root" : "hydrate-root"}`,
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      exportName,
      errorCode: operation.thrown.code
    });
    return;
  }

  failures.push({
    gateStatus: "public-root-export-not-placeholder-blocked",
    exportName,
    operation
  });
}

function validatePrivateRootBridgeBoundary({
  privateRootBridgeBoundary,
  blockedPrivateBridgeRows,
  failures
}) {
  if (privateRootBridgeBoundary.loadError) {
    failures.push({
      gateStatus: "private-root-bridge-load-failed",
      error: privateRootBridgeBoundary.loadError
    });
    return;
  }

  const records = [
    privateRootBridgeBoundary.create,
    privateRootBridgeBoundary.render,
    privateRootBridgeBoundary.unmount,
    privateRootBridgeBoundary.secondUnmount
  ];
  if (records.some((record) => record.nativeExecution !== false)) {
    failures.push({
      gateStatus: "private-root-bridge-native-execution-enabled",
      records
    });
  }
  if (
    privateRootBridgeBoundary.create.requestType !== "createRoot" ||
    privateRootBridgeBoundary.render.requestType !== "root.render" ||
    privateRootBridgeBoundary.unmount.requestType !== "root.unmount"
  ) {
    failures.push({
      gateStatus: "private-root-bridge-request-type-mismatch",
      create: privateRootBridgeBoundary.create.requestType,
      render: privateRootBridgeBoundary.render.requestType,
      unmount: privateRootBridgeBoundary.unmount.requestType
    });
  }
  if (
    privateRootBridgeBoundary.create.markerGuard?.action !==
      "defer-mark-container-as-root" ||
    privateRootBridgeBoundary.create.listenerGuard?.action !==
      "defer-listen-to-all-supported-events" ||
    privateRootBridgeBoundary.render.markerGuard !== null ||
    privateRootBridgeBoundary.unmount.markerGuard?.action !==
      "defer-unmark-container-as-root-after-sync-flush"
  ) {
    failures.push({
      gateStatus: "private-root-bridge-side-effect-guard-mismatch",
      createMarkerGuard: privateRootBridgeBoundary.create.markerGuard,
      createListenerGuard: privateRootBridgeBoundary.create.listenerGuard,
      renderMarkerGuard: privateRootBridgeBoundary.render.markerGuard,
      unmountMarkerGuard: privateRootBridgeBoundary.unmount.markerGuard
    });
  }
  if (
    privateRootBridgeBoundary.unmount.sync !== true ||
    privateRootBridgeBoundary.secondUnmount.noOp !== true ||
    privateRootBridgeBoundary.secondUnmount.sync !== false
  ) {
    failures.push({
      gateStatus: "private-root-bridge-unmount-boundary-mismatch",
      unmount: privateRootBridgeBoundary.unmount,
      secondUnmount: privateRootBridgeBoundary.secondUnmount
    });
  }
  if (
    privateRootBridgeBoundary.renderAfterUnmount.status !== "throws" ||
    privateRootBridgeBoundary.renderAfterUnmount.thrown.code !==
      "FAST_REACT_DOM_UNMOUNTED_ROOT"
  ) {
    failures.push({
      gateStatus: "private-root-bridge-render-after-unmount-not-blocked",
      renderAfterUnmount: privateRootBridgeBoundary.renderAfterUnmount
    });
  }
  if (!isRootFacadeSideEffectFree(privateRootBridgeBoundary.sideEffects)) {
    failures.push({
      gateStatus: "private-root-bridge-produced-public-side-effects",
      sideEffects: privateRootBridgeBoundary.sideEffects
    });
  }

  if (failures.some((failure) => failure.gateStatus.startsWith("private-root-bridge"))) {
    return;
  }

  for (const id of [
    "private-create-root-record",
    "private-root-render-record",
    "private-root-unmount-record",
    "private-double-unmount-noop-record"
  ]) {
    blockedPrivateBridgeRows.push({
      id,
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BRIDGE_RECORD_ONLY_STATUS,
      compatibilityClaimed: false
    });
  }
}

function rejectClientRootCompatibilityClaimsWhileBlocked({
  clientRootOracle,
  failures
}) {
  if (!clientRootOracle) {
    return;
  }
  for (const key of [
    "fastReactBehaviorCompatible",
    "fullDualRunOracleExists",
    "compatibilityClaimed"
  ]) {
    if (clientRootOracle.conformanceClaims?.[key] !== false) {
      failures.push({
        gateStatus: `client-root-oracle-claims-${key}-while-blocked`,
        value: clientRootOracle.conformanceClaims?.[key] ?? null
      });
    }
  }
}

function attemptRootFacadeOperation(
  label,
  callback,
  container,
  ownerDocument,
  rootMarkers,
  listenerRegistry
) {
  const result = attemptGateOperation(label, callback);
  const value = result.status === "ok" ? result.value : null;
  const rootObjectCreated = value?.type === "object";
  return {
    ...result,
    rootObjectCreated,
    sideEffects: inspectRootFacadeSideEffects(
      container,
      ownerDocument,
      rootMarkers,
      listenerRegistry
    )
  };
}

function attemptGateOperation(label, callback) {
  try {
    return {
      label,
      status: "ok",
      value: describeLocalValue(callback())
    };
  } catch (error) {
    return {
      label,
      status: "throws",
      thrown: serializeGateError(error)
    };
  }
}

function inspectRootFacadeSideEffects(
  container,
  ownerDocument,
  rootMarkers,
  listenerRegistry
) {
  return {
    containerMarker: rootMarkers.inspectContainerRootMarker(container),
    containerListeningMarker: listenerRegistry.inspectListeningMarker(container),
    ownerDocumentListeningMarker:
      listenerRegistry.inspectListeningMarker(ownerDocument),
    listenerRegistrationCount: container.__registrations.length,
    mutationCount: container.__mutationLog.length,
    ownerDocumentListenerRegistrationCount:
      ownerDocument.__registrations.length,
    ownerDocumentMutationCount: ownerDocument.__mutationLog.length
  };
}

function isRootFacadeSideEffectFree(sideEffects) {
  return (
    sideEffects.containerMarker.propertyCount === 0 &&
    sideEffects.containerMarker.truthyCount === 0 &&
    sideEffects.containerListeningMarker.propertyCount === 0 &&
    sideEffects.ownerDocumentListeningMarker.propertyCount === 0 &&
    sideEffects.listenerRegistrationCount === 0 &&
    sideEffects.mutationCount === 0 &&
    sideEffects.ownerDocumentListenerRegistrationCount === 0 &&
    sideEffects.ownerDocumentMutationCount === 0
  );
}

function summarizePrivateRootBridgeCreateRecord(record) {
  return {
    $$typeof: record.$$typeof,
    kind: record.kind,
    operation: record.operation,
    requestId: record.requestId,
    requestSequence: record.requestSequence,
    requestType: record.requestType,
    sequence: record.sequence,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    containerInfo: record.containerInfo,
    listenerGuard: record.listenerGuard,
    markerGuard: record.markerGuard,
    nativeExecution: record.nativeExecution,
    rootOptionsInfo: record.rootOptionsInfo,
    ownerType: record.owner?.$$typeof ?? null,
    handleType: record.handle?.$$typeof ?? null
  };
}

function summarizePrivateRootBridgeUpdateRecord(record) {
  return {
    $$typeof: record.$$typeof,
    kind: record.kind,
    operation: record.operation,
    requestId: record.requestId,
    requestSequence: record.requestSequence,
    requestType: record.requestType,
    sequence: record.sequence,
    updateId: record.updateId,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    lifecycleStatusAfter: record.lifecycleStatusAfter,
    lifecycleStatusBefore: record.lifecycleStatusBefore,
    markerGuard: record.markerGuard,
    nativeExecution: record.nativeExecution,
    noOp: record.noOp,
    renderCount: record.renderCount,
    sync: record.sync,
    elementInfo: record.elementInfo,
    callbackInfo: record.callbackInfo
  };
}

function createGateDocument(label, domContainer) {
  const document = createGateEventTarget({
    label,
    nodeName: "#document",
    nodeType: domContainer.DOCUMENT_NODE
  });
  document.ownerDocument = document;
  document.defaultView = createGateEventTarget({
    label: `${label}-window`
  });
  return document;
}

function createGateElement(nodeName, ownerDocument, domContainer) {
  return createGateEventTarget({
    nodeName,
    nodeType: domContainer.ELEMENT_NODE,
    ownerDocument
  });
}

function createGateEventTarget(fields) {
  const target = {
    ...fields,
    __mutationLog: [],
    __registrations: [],
    addEventListener(type, listener, options) {
      this.__registrations.push({
        listenerType: typeof listener,
        options,
        type
      });
    },
    appendChild(child) {
      this.__mutationLog.push({
        child: describeLocalValue(child),
        type: "appendChild"
      });
    },
    insertBefore(child, beforeChild) {
      this.__mutationLog.push({
        beforeChild: describeLocalValue(beforeChild),
        child: describeLocalValue(child),
        type: "insertBefore"
      });
    },
    removeChild(child) {
      this.__mutationLog.push({
        child: describeLocalValue(child),
        type: "removeChild"
      });
    }
  };
  let textContent = "";
  Object.defineProperty(target, "textContent", {
    configurable: true,
    enumerable: true,
    get() {
      return textContent;
    },
    set(value) {
      textContent = value;
      this.__mutationLog.push({
        type: "textContent",
        value
      });
    }
  });
  return target;
}

function describeLocalFunction(value) {
  if (typeof value !== "function") {
    return describeLocalValue(value);
  }
  return {
    length: value.length,
    name: value.name || "",
    type: "function"
  };
}

function describeLocalValue(value) {
  if (value === null) {
    return {
      type: "null"
    };
  }
  const type = typeof value;
  if (type === "undefined") {
    return {
      type: "undefined"
    };
  }
  if (type === "string" || type === "number" || type === "boolean") {
    return {
      type,
      value
    };
  }
  if (type === "function") {
    return describeLocalFunction(value);
  }
  if (type === "symbol") {
    return {
      description: value.description ?? null,
      type: "symbol"
    };
  }
  if (Array.isArray(value)) {
    return {
      length: value.length,
      type: "array"
    };
  }
  return {
    keys: Object.keys(value).sort(),
    type: "object"
  };
}

function serializeGateError(error) {
  return {
    name: error?.name ?? "Error",
    code: error?.code ?? null,
    message: error?.message ?? String(error),
    entrypoint: error?.entrypoint ?? null,
    exportName: error?.exportName ?? null,
    compatibilityTarget: error?.compatibilityTarget ?? null
  };
}

function rejectCompatibilityClaimsWhileBlocked({
  checkedOracle,
  currentOracle,
  failures
}) {
  for (const [label, oracle] of [
    ["checked", checkedOracle],
    ["current", currentOracle]
  ]) {
    for (const key of [
      "fastReactBehaviorCompatible",
      "fullDualRunOracleExists",
      "compatibilityClaimed"
    ]) {
      if (oracle.conformanceClaims?.[key] !== false) {
        failures.push({
          gateStatus: `${label}-oracle-claims-${key}-while-blocked`,
          value: oracle.conformanceClaims?.[key] ?? null
        });
      }
    }
  }
}

function validateLocalFastReactBehavior({ behaviorByScenario, failures }) {
  const admittedScenarioIds = new Set(
    REACT_DOM_ROOT_RENDER_E2E_CONFORMANCE_GATE.admittedScenarioIds
  );

  for (const scenarioId of REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS) {
    if (!behaviorByScenario.has(scenarioId)) {
      failures.push({
        scenarioId,
        gateStatus: "missing-local-fast-react-behavior"
      });
    }
  }

  for (const scenarioId of behaviorByScenario.keys()) {
    if (!REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.includes(scenarioId)) {
      failures.push({
        scenarioId,
        gateStatus: "unknown-local-fast-react-behavior-scenario"
      });
    }
  }

  for (const behavior of behaviorByScenario.values()) {
    const admittedByBehavior = behavior.admission === "admitted";
    const admittedByGate = admittedScenarioIds.has(behavior.scenarioId);
    if (admittedByBehavior !== admittedByGate) {
      failures.push({
        scenarioId: behavior.scenarioId,
        gateStatus: "admission-metadata-mismatch",
        behaviorAdmission: behavior.admission,
        gateAdmitted: admittedByGate
      });
    }
  }
}

function validateOracleShape({ checkedOracle, currentOracle, failures }) {
  for (const [label, oracle] of [
    ["checked", checkedOracle],
    ["current", currentOracle]
  ]) {
    if (oracle?.oracleKind !== "react-19.2.6-react-dom-root-render-e2e-oracle") {
      failures.push({
        gateStatus: `${label}-oracle-kind-mismatch`,
        oracleKind: oracle?.oracleKind ?? null
      });
    }
    if (oracle?.reactDomTarget?.packageName !== REACT_DOM_ROOT_RENDER_E2E_TARGET.packageName) {
      failures.push({
        gateStatus: `${label}-react-dom-target-mismatch`,
        packageName: oracle?.reactDomTarget?.packageName ?? null
      });
    }
    if (
      oracle?.fastReactTarget?.packageName !==
      REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET.packageName
    ) {
      failures.push({
        gateStatus: `${label}-fast-react-target-mismatch`,
        packageName: oracle?.fastReactTarget?.packageName ?? null
      });
    }
  }
}

function findObservation({ oracle, modeId, packageName, scenarioId }) {
  const observations =
    packageName === oracle.fastReactTarget?.packageName
      ? oracle.fastReactObservations?.[modeId]
      : oracle.reactDomObservations?.[modeId];
  return (
    observations?.find(
      (observation) =>
        observation.packageName === packageName &&
        observation.scenarioId === scenarioId
    ) ?? null
  );
}

function findComparison({ oracle, modeId, scenarioId }) {
  return (
    oracle.fastReactComparisons?.[modeId]?.find(
      (comparison) => comparison.scenarioId === scenarioId
    ) ?? null
  );
}

function comparableProbeResult(result) {
  const { targetPackage: _targetPackage, ...behaviorResult } = result;
  return behaviorResult;
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
      : "gate";
  const details = Object.entries(failure)
    .filter(([key]) => !["modeId", "scenarioId", "gateStatus"].includes(key))
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(" ");
  return details
    ? `${location} ${failure.gateStatus} ${details}`
    : `${location} ${failure.gateStatus}`;
}
