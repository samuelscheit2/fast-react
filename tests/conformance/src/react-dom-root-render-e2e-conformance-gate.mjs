import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_GATE_ID =
  "root-render-private-bridge-dual-run-gate-1";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_MATCH_STATUS =
  "matched-private-root-bridge-request-record";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_BLOCKED_STATUS =
  "blocked-private-root-bridge-request-row";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_REQUEST_ADMISSIONS =
  Object.freeze([
    {
      scenarioId: "create-root-no-render",
      admission: "private-request-comparable",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_MATCH_STATUS,
      reason:
        "The private bridge can compare inert createRoot request metadata while public root objects, marker writes, and listener installation remain blocked."
    },
    {
      scenarioId: "initial-host-render",
      admission: "private-request-comparable",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_MATCH_STATUS,
      reason:
        "The private bridge can compare create plus first root.render request metadata without claiming host commit or DOM mutation behavior."
    },
    {
      scenarioId: "update-host-render",
      admission: "private-request-comparable",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_MATCH_STATUS,
      reason:
        "The private bridge can compare repeated root.render request metadata while update reconciliation and DOM mutation stay blocked."
    },
    {
      scenarioId: "replace-host-tree",
      admission: "private-request-comparable",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_MATCH_STATUS,
      reason:
        "The private bridge can compare replacement render request ordering without claiming host child replacement."
    },
    {
      scenarioId: "render-null-clears-container",
      admission: "private-request-comparable",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_MATCH_STATUS,
      reason:
        "The private bridge can compare a render(null) request while public container clearing remains blocked."
    },
    {
      scenarioId: "root-unmount",
      admission: "private-request-comparable",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_MATCH_STATUS,
      reason:
        "The private bridge can compare sync unmount request metadata and deferred marker cleanup metadata without mutating the container."
    },
    {
      scenarioId: "double-unmount",
      admission: "private-request-comparable",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_MATCH_STATUS,
      reason:
        "The private bridge can compare repeated unmount request metadata, including the second no-op private request."
    },
    {
      scenarioId: "render-after-unmount",
      admission: "private-request-comparable",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_MATCH_STATUS,
      reason:
        "The private bridge can compare its fail-closed render-after-unmount guard while public stale-root behavior remains blocked."
    },
    {
      scenarioId: "flush-sync-cross-root-render",
      admission: "private-request-comparable",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_MATCH_STATUS,
      reason:
        "The private bridge can compare two-root create/render request ordering without claiming flushSync or commit behavior."
    },
    {
      scenarioId: "development-warning-boundaries",
      admission: "unsupported",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_BLOCKED_STATUS,
      reason:
        "Development warning rows are public facade diagnostics; the private bridge request gate does not compare console warning compatibility."
    }
  ]);

export async function runReactDomRootRenderE2EConformanceGate({
  checkedOracle = readCheckedReactDomRootRenderE2EOracle(),
  currentOracle,
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  return evaluateReactDomRootRenderE2EConformanceGate({
    checkedOracle,
    currentOracle: currentOracle ?? (await generateReactDomRootRenderE2EOracle()),
    privateBridgeObservations:
      inspectReactDomRootRenderE2EPrivateBridgeRequests({ workspaceRoot })
  });
}

export function evaluateReactDomRootRenderE2EConformanceGate({
  checkedOracle,
  currentOracle,
  privateBridgeObservations =
    inspectReactDomRootRenderE2EPrivateBridgeRequests()
}) {
  const failures = [];
  const admitted = [];
  const blocked = [];
  const privateBridgeComparableRows = [];
  const privateBridgeBlockedRows = [];
  const behaviorByScenario = new Map(
    REACT_DOM_ROOT_RENDER_E2E_LOCAL_FAST_REACT_BEHAVIOR.map((behavior) => [
      behavior.scenarioId,
      behavior
    ])
  );
  const privateBridgeAdmissionByScenario = new Map(
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_REQUEST_ADMISSIONS.map(
      (admission) => [admission.scenarioId, admission]
    )
  );
  const privateBridgeObservationByRow = new Map(
    (privateBridgeObservations.rows ?? []).map((row) => [
      formatScenarioModeKey(row),
      row
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
  validatePrivateBridgeAdmissionMetadata({
    privateBridgeAdmissionByScenario,
    failures
  });

  if (privateBridgeObservations.loadError) {
    failures.push({
      gateStatus: "private-root-bridge-request-observation-load-failed",
      error: privateBridgeObservations.loadError
    });
  }

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

      const oracleRowAccepted =
        checkedReactObservation.result?.result?.status === "ok";

      if (behavior.admission === "admitted") {
        const firstDifferencePath = findFirstDifferencePath(
          comparableProbeResult(checkedReactObservation.result),
          comparableProbeResult(currentFastReactObservation.result)
        );
        if (firstDifferencePath === null) {
          admitted.push({
            ...context,
            gateStatus: "matched-react-dom-19.2.6-oracle",
            oracleRowAccepted,
            surface: "public-react-dom-client-root-facade"
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
          comparisonStatus: currentComparison.status,
          oracleRowAccepted,
          surface: "public-react-dom-client-root-facade"
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

      const privateAdmission = privateBridgeAdmissionByScenario.get(scenarioId);
      if (!privateAdmission) {
        failures.push({
          ...context,
          gateStatus: "missing-private-root-bridge-request-admission"
        });
        continue;
      }

      if (privateAdmission.admission === "private-request-comparable") {
        const privateObservation = privateBridgeObservationByRow.get(
          formatScenarioModeKey(context)
        );

        if (!privateObservation) {
          failures.push({
            ...context,
            gateStatus: "missing-private-root-bridge-request-observation"
          });
          continue;
        }

        if (privateObservation.status !== "ok") {
          failures.push({
            ...context,
            gateStatus: "private-root-bridge-request-observation-failed",
            status: privateObservation.status,
            error: privateObservation.error ?? null
          });
          continue;
        }

        const firstDifferencePath = findFirstDifferencePath(
          expectedPrivateBridgeComparableObservation(scenarioId),
          comparablePrivateBridgeObservation(privateObservation)
        );

        if (firstDifferencePath === null) {
          privateBridgeComparableRows.push({
            ...context,
            gateStatus: privateAdmission.gateStatus,
            oracleRowAccepted,
            publicFacadeGateStatus: behavior.gateStatus,
            requestRecordCount: privateObservation.requestRecords.length,
            comparedToReactDomOracle: false,
            compatibilityClaimed: false
          });
        } else {
          failures.push({
            ...context,
            gateStatus: "private-root-bridge-request-output-mismatch",
            firstDifferencePath
          });
        }
        continue;
      }

      if (privateAdmission.admission === "unsupported") {
        privateBridgeBlockedRows.push({
          ...context,
          gateStatus: privateAdmission.gateStatus,
          oracleRowAccepted,
          publicFacadeGateStatus: behavior.gateStatus,
          reason: privateAdmission.reason,
          comparedToReactDomOracle: false,
          compatibilityClaimed: false
        });
        continue;
      }

      failures.push({
        ...context,
        gateStatus: "unknown-private-root-bridge-request-admission",
        admission: privateAdmission.admission
      });
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
    privateBridgeGate: {
      id: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_GATE_ID,
      localEntrypoint:
        "packages/react-dom/src/client/root-bridge.js#private request records",
      admittedPrivateRequestScenarioIds:
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_REQUEST_ADMISSIONS.filter(
          (admission) => admission.admission === "private-request-comparable"
        ).map((admission) => admission.scenarioId),
      unsupportedPrivateRequestScenarioIds:
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_REQUEST_ADMISSIONS.filter(
          (admission) => admission.admission === "unsupported"
        ).map((admission) => admission.scenarioId),
      compatibilityClaimed: false
    },
    ok: failures.length === 0,
    admittedScenarioModeRows: admitted,
    blockedScenarioModeRows: blocked,
    privateBridgeComparableScenarioModeRows: privateBridgeComparableRows,
    privateBridgeBlockedScenarioModeRows: privateBridgeBlockedRows,
    failures,
    summary: {
      admittedScenarioModeRowCount: admitted.length,
      blockedScenarioModeRowCount: blocked.length,
      privateBridgeComparableScenarioModeRowCount:
        privateBridgeComparableRows.length,
      privateBridgeBlockedScenarioModeRowCount:
        privateBridgeBlockedRows.length,
      failureCount: failures.length,
      totalScenarioModeRowCount:
        REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length *
        REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length,
      compatibilityAdmitted:
        failures.length === 0 &&
        blocked.length === 0 &&
        admitted.length > 0,
      privateBridgeCompatibilityClaimed: false,
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
    `Private bridge request rows compared: ${result.summary.privateBridgeComparableScenarioModeRowCount}`,
    `Private bridge request rows blocked: ${result.summary.privateBridgeBlockedScenarioModeRowCount}`,
    `Failures: ${result.summary.failureCount}`
  ];

  if (result.blockedScenarioModeRows.length > 0) {
    lines.push(
      "Compatibility remains blocked; unsupported local rows are not admitted as passing root E2E behavior."
    );
  }
  if (result.privateBridgeComparableScenarioModeRows.length > 0) {
    lines.push(
      "Private root-bridge rows compare request metadata only; public createRoot, DOM mutation, listeners, hydration, and compatibility claims remain blocked."
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

export function inspectReactDomRootRenderE2EPrivateBridgeRequests({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  try {
    const modules = loadPrivateBridgeModules(workspaceRoot);
    const rows = [];

    for (const mode of REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES) {
      for (const scenarioId of REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS) {
        const admission =
          REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_REQUEST_ADMISSIONS.find(
            (candidate) => candidate.scenarioId === scenarioId
          );
        if (admission?.admission !== "private-request-comparable") {
          continue;
        }

        rows.push(
          runPrivateBridgeRequestScenario({
            mode,
            modules,
            scenarioId
          })
        );
      }
    }

    return {
      loadError: null,
      rows
    };
  } catch (error) {
    return {
      loadError: describePrivateBridgeError(error),
      rows: []
    };
  }
}

function loadPrivateBridgeModules(workspaceRoot) {
  const reactDomRoot = join(workspaceRoot, "packages/react-dom");
  return {
    rootBridge: require(join(reactDomRoot, "src/client/root-bridge.js")),
    rootMarkers: require(join(reactDomRoot, "src/client/root-markers.js")),
    listenerRegistry: require(
      join(reactDomRoot, "src/events/listener-registry.js")
    ),
    domContainer: require(join(reactDomRoot, "src/client/dom-container.js"))
  };
}

function runPrivateBridgeRequestScenario({ mode, modules, scenarioId }) {
  try {
    const plan = getPrivateBridgeRequestPlan(scenarioId);
    const bridge = modules.rootBridge.createPrivateRootBridgeShell();
    const roots = new Map();
    const containers = [];
    const documents = [];
    const requestRecords = [];
    const thrownOperations = [];

    for (const step of plan) {
      if (step.operation === "create") {
        const document = createPrivateBridgeDocument({
          label: `${mode.id}:${scenarioId}:${step.root}`,
          domContainer: modules.domContainer
        });
        const container = createPrivateBridgeElement({
          domContainer: modules.domContainer,
          nodeName: "DIV",
          ownerDocument: document
        });
        const record = bridge.createClientRoot(container);
        roots.set(step.root, {
          container,
          document,
          handle: record.handle
        });
        containers.push(container);
        documents.push(document);
        requestRecords.push(normalizePrivateBridgeRequestRecord(record));
        continue;
      }

      const root = roots.get(step.root);
      if (!root) {
        throw new Error(
          `Private bridge request plan used unknown root: ${step.root}`
        );
      }

      if (step.operation === "render") {
        const record = bridge.renderContainer(
          root.handle,
          createPrivateBridgeElementValue(step.elementKind)
        );
        requestRecords.push(normalizePrivateBridgeRequestRecord(record));
        continue;
      }

      if (step.operation === "unmount") {
        const record = bridge.unmountContainer(root.handle);
        requestRecords.push(normalizePrivateBridgeRequestRecord(record));
        continue;
      }

      if (step.operation === "render-after-unmount-throws") {
        try {
          bridge.renderContainer(
            root.handle,
            createPrivateBridgeElementValue("object")
          );
        } catch (error) {
          thrownOperations.push({
            operation: "root.render",
            error: describePrivateBridgeError(error)
          });
          continue;
        }

        throw new Error(
          "Private bridge render-after-unmount request did not throw."
        );
      }

      throw new Error(
        `Unknown private bridge request operation: ${step.operation}`
      );
    }

    return {
      modeId: mode.id,
      scenarioId,
      status: "ok",
      requestRecords,
      sideEffects: summarizePrivateBridgeSideEffects({
        containers,
        documents,
        modules,
        requestRecords
      }),
      thrownOperations
    };
  } catch (error) {
    return {
      modeId: mode.id,
      scenarioId,
      status: "throws",
      error: describePrivateBridgeError(error)
    };
  }
}

function getPrivateBridgeRequestPlan(scenarioId) {
  switch (scenarioId) {
    case "create-root-no-render":
      return [{ operation: "create", root: "primary" }];
    case "initial-host-render":
      return [
        { operation: "create", root: "primary" },
        { elementKind: "object", operation: "render", root: "primary" }
      ];
    case "update-host-render":
      return [
        { operation: "create", root: "primary" },
        { elementKind: "object", operation: "render", root: "primary" },
        { elementKind: "object", operation: "render", root: "primary" }
      ];
    case "replace-host-tree":
      return [
        { operation: "create", root: "primary" },
        { elementKind: "object", operation: "render", root: "primary" },
        { elementKind: "object", operation: "render", root: "primary" }
      ];
    case "render-null-clears-container":
      return [
        { operation: "create", root: "primary" },
        { elementKind: "object", operation: "render", root: "primary" },
        { elementKind: "null", operation: "render", root: "primary" }
      ];
    case "root-unmount":
      return [
        { operation: "create", root: "primary" },
        { elementKind: "object", operation: "render", root: "primary" },
        { operation: "unmount", root: "primary" }
      ];
    case "double-unmount":
      return [
        { operation: "create", root: "primary" },
        { elementKind: "object", operation: "render", root: "primary" },
        { operation: "unmount", root: "primary" },
        { operation: "unmount", root: "primary" }
      ];
    case "render-after-unmount":
      return [
        { operation: "create", root: "primary" },
        { elementKind: "object", operation: "render", root: "primary" },
        { operation: "unmount", root: "primary" },
        { operation: "render-after-unmount-throws", root: "primary" }
      ];
    case "flush-sync-cross-root-render":
      return [
        { operation: "create", root: "first" },
        { operation: "create", root: "second" },
        { elementKind: "object", operation: "render", root: "first" },
        { elementKind: "object", operation: "render", root: "second" }
      ];
    default:
      throw new Error(
        `No private bridge request plan for scenario: ${scenarioId}`
      );
  }
}

function normalizePrivateBridgeRequestRecord(record) {
  const base = {
    kind: record.kind,
    nativeExecution: record.nativeExecution,
    operation: record.operation,
    requestId: record.requestId,
    requestSequence: record.requestSequence,
    requestType: record.requestType,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    sequence: record.sequence
  };

  if (record.operation === "create") {
    return {
      ...base,
      containerInfo: record.containerInfo,
      listenerGuard: record.listenerGuard,
      markerGuard: record.markerGuard,
      rootOptionsInfo: record.rootOptionsInfo
    };
  }

  return {
    ...base,
    callbackInfo: record.callbackInfo,
    elementInfo: record.elementInfo,
    lifecycleStatusAfter: record.lifecycleStatusAfter,
    lifecycleStatusBefore: record.lifecycleStatusBefore,
    markerGuard: record.markerGuard,
    noOp: record.noOp,
    renderCount: record.renderCount,
    sync: record.sync,
    updateId: record.updateId
  };
}

function comparablePrivateBridgeObservation(observation) {
  return {
    requestRecords: observation.requestRecords,
    sideEffects: observation.sideEffects,
    thrownOperations: observation.thrownOperations
  };
}

function expectedPrivateBridgeComparableObservation(scenarioId) {
  return buildExpectedPrivateBridgeObservation(
    getPrivateBridgeRequestPlan(scenarioId)
  );
}

function buildExpectedPrivateBridgeObservation(plan) {
  const requestRecords = [];
  const thrownOperations = [];
  const rootStates = new Map();
  let nextRequestSequence = 1;
  let nextRootSequence = 1;
  let nextUpdateSequence = 1;

  for (const step of plan) {
    if (step.operation === "create") {
      const rootId = `root:${nextRootSequence}`;
      rootStates.set(step.root, {
        lifecycleStatus: "created",
        renderCount: 0,
        rootId
      });
      requestRecords.push({
        kind: "FastReactDomPrivateRootCreateRecord",
        nativeExecution: false,
        operation: "create",
        requestId: `request:${nextRequestSequence}`,
        requestSequence: nextRequestSequence,
        requestType: "createRoot",
        rootId,
        rootKind: "client",
        rootTag: "ConcurrentRoot",
        sequence: nextRootSequence,
        containerInfo: {
          kind: "object",
          nodeName: "DIV",
          nodeType: 1
        },
        listenerGuard: {
          action: "defer-listen-to-all-supported-events",
          canInstallRootListeners: true,
          hasRootListeningMarker: false,
          ownerDocumentCanInstallSelectionChange: true,
          ownerDocumentHasSelectionChangeMarker: false,
          ownerDocumentInfo: {
            kind: "object",
            nodeName: "#document",
            nodeType: 9
          },
          rootEventTargetInfo: {
            kind: "object",
            nodeName: "DIV",
            nodeType: 1
          }
        },
        markerGuard: {
          action: "defer-mark-container-as-root",
          hasLegacyRootMarker: false,
          isContainerMarkedAsRoot: false,
          warning: null
        },
        rootOptionsInfo: {
          type: "undefined"
        }
      });
      nextRequestSequence++;
      nextRootSequence++;
      continue;
    }

    const rootState = rootStates.get(step.root);
    if (!rootState) {
      throw new Error(`Expected plan used unknown root: ${step.root}`);
    }

    if (step.operation === "render") {
      const lifecycleStatusBefore = rootState.lifecycleStatus;
      rootState.lifecycleStatus = "rendered";
      rootState.renderCount++;
      requestRecords.push({
        kind: "FastReactDomPrivateRootUpdateRecord",
        nativeExecution: false,
        operation: "render",
        requestId: `request:${nextRequestSequence}`,
        requestSequence: nextRequestSequence,
        requestType: "root.render",
        rootId: rootState.rootId,
        rootKind: "client",
        rootTag: "ConcurrentRoot",
        sequence: nextUpdateSequence,
        callbackInfo: {
          type: "undefined"
        },
        elementInfo: expectedPrivateBridgeElementInfo(step.elementKind),
        lifecycleStatusAfter: rootState.lifecycleStatus,
        lifecycleStatusBefore,
        markerGuard: null,
        noOp: false,
        renderCount: rootState.renderCount,
        sync: false,
        updateId: `update:${nextUpdateSequence}`
      });
      nextRequestSequence++;
      nextUpdateSequence++;
      continue;
    }

    if (step.operation === "unmount") {
      const lifecycleStatusBefore = rootState.lifecycleStatus;
      const noOp = lifecycleStatusBefore === "unmounted";
      rootState.lifecycleStatus = "unmounted";
      requestRecords.push({
        kind: "FastReactDomPrivateRootUpdateRecord",
        nativeExecution: false,
        operation: "unmount",
        requestId: `request:${nextRequestSequence}`,
        requestSequence: nextRequestSequence,
        requestType: "root.unmount",
        rootId: rootState.rootId,
        rootKind: "client",
        rootTag: "ConcurrentRoot",
        sequence: nextUpdateSequence,
        callbackInfo: {
          type: "undefined"
        },
        elementInfo: {
          type: "null"
        },
        lifecycleStatusAfter: rootState.lifecycleStatus,
        lifecycleStatusBefore,
        markerGuard: {
          action: "defer-unmark-container-as-root-after-sync-flush",
          isContainerMarkedAsRoot: false
        },
        noOp,
        renderCount: rootState.renderCount,
        sync: !noOp,
        updateId: `update:${nextUpdateSequence}`
      });
      nextRequestSequence++;
      nextUpdateSequence++;
      continue;
    }

    if (step.operation === "render-after-unmount-throws") {
      thrownOperations.push({
        operation: "root.render",
        error: {
          code: "FAST_REACT_DOM_UNMOUNTED_ROOT",
          message: "Cannot update an unmounted root."
        }
      });
      continue;
    }
  }

  return {
    requestRecords,
    sideEffects: {
      compatibilityClaimed: false,
      containerListenerRegistrationCount: 0,
      containerListeningMarkerPropertyCount: 0,
      containerMarkerPropertyCount: 0,
      containerMutationCount: 0,
      domMutationObserved: false,
      hydrationRequested: false,
      listenerInstallationObserved: false,
      markerWriteObserved: false,
      nativeExecutionObserved: false,
      ownerDocumentListenerRegistrationCount: 0,
      ownerDocumentListeningMarkerPropertyCount: 0,
      ownerDocumentMutationCount: 0,
      publicCreateRootEnabled: false,
      publicHydrateRootEnabled: false
    },
    thrownOperations
  };
}

function expectedPrivateBridgeElementInfo(elementKind) {
  if (elementKind === "null") {
    return {
      type: "null"
    };
  }

  return {
    keys: ["props", "type"],
    type: "object"
  };
}

function createPrivateBridgeElementValue(elementKind) {
  if (elementKind === "null") {
    return null;
  }

  return {
    props: {
      children: "private bridge child"
    },
    type: "div"
  };
}

function summarizePrivateBridgeSideEffects({
  containers,
  documents,
  modules,
  requestRecords
}) {
  const containerMarkerPropertyCount = sum(
    containers,
    (container) =>
      modules.rootMarkers.inspectContainerRootMarker(container).propertyCount
  );
  const containerListeningMarkerPropertyCount = sum(
    containers,
    (container) =>
      modules.listenerRegistry.inspectListeningMarker(container).propertyCount
  );
  const ownerDocumentListeningMarkerPropertyCount = sum(
    documents,
    (document) =>
      modules.listenerRegistry.inspectListeningMarker(document).propertyCount
  );
  const containerListenerRegistrationCount = sum(
    containers,
    (container) => container.__registrations.length
  );
  const ownerDocumentListenerRegistrationCount = sum(
    documents,
    (document) => document.__registrations.length
  );
  const containerMutationCount = sum(
    containers,
    (container) => container.__mutationLog.length
  );
  const ownerDocumentMutationCount = sum(
    documents,
    (document) => document.__mutationLog.length
  );

  return {
    compatibilityClaimed: false,
    containerListenerRegistrationCount,
    containerListeningMarkerPropertyCount,
    containerMarkerPropertyCount,
    containerMutationCount,
    domMutationObserved:
      containerMutationCount > 0 || ownerDocumentMutationCount > 0,
    hydrationRequested: false,
    listenerInstallationObserved:
      containerListenerRegistrationCount > 0 ||
      ownerDocumentListenerRegistrationCount > 0 ||
      containerListeningMarkerPropertyCount > 0 ||
      ownerDocumentListeningMarkerPropertyCount > 0,
    markerWriteObserved: containerMarkerPropertyCount > 0,
    nativeExecutionObserved: requestRecords.some(
      (record) => record.nativeExecution !== false
    ),
    ownerDocumentListenerRegistrationCount,
    ownerDocumentListeningMarkerPropertyCount,
    ownerDocumentMutationCount,
    publicCreateRootEnabled: false,
    publicHydrateRootEnabled: false
  };
}

function createPrivateBridgeDocument({ domContainer, label }) {
  const document = createPrivateBridgeEventTarget({
    label,
    nodeName: "#document",
    nodeType: domContainer.DOCUMENT_NODE
  });
  document.ownerDocument = document;
  document.defaultView = createPrivateBridgeEventTarget({
    label: `${label}:window`
  });
  return document;
}

function createPrivateBridgeElement({
  domContainer,
  nodeName,
  ownerDocument
}) {
  return createPrivateBridgeEventTarget({
    nodeName,
    nodeType: domContainer.ELEMENT_NODE,
    ownerDocument
  });
}

function createPrivateBridgeEventTarget(fields) {
  const target = {
    ...fields,
    __mutationLog: [],
    __registrations: [],
    addEventListener(type, listener, options) {
      this.__registrations.push({
        listener,
        options,
        type
      });
    },
    appendChild(child) {
      this.__mutationLog.push({ child, type: "appendChild" });
    },
    insertBefore(child, beforeChild) {
      this.__mutationLog.push({ beforeChild, child, type: "insertBefore" });
    },
    removeChild(child) {
      this.__mutationLog.push({ child, type: "removeChild" });
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
      this.__mutationLog.push({ type: "textContent", value });
    }
  });
  return target;
}

function describePrivateBridgeError(error) {
  return {
    code: error?.code ?? null,
    message: error?.message ?? String(error)
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

function validatePrivateBridgeAdmissionMetadata({
  privateBridgeAdmissionByScenario,
  failures
}) {
  for (const scenarioId of REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS) {
    if (!privateBridgeAdmissionByScenario.has(scenarioId)) {
      failures.push({
        scenarioId,
        gateStatus: "missing-private-root-bridge-request-admission"
      });
    }
  }

  for (const [scenarioId, admission] of privateBridgeAdmissionByScenario) {
    if (!REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.includes(scenarioId)) {
      failures.push({
        scenarioId,
        gateStatus: "unknown-private-root-bridge-request-admission-scenario"
      });
    }
    if (
      admission.admission !== "private-request-comparable" &&
      admission.admission !== "unsupported"
    ) {
      failures.push({
        scenarioId,
        gateStatus: "unknown-private-root-bridge-request-admission",
        admission: admission.admission
      });
    }
    if (admission.admission === "private-request-comparable") {
      try {
        getPrivateBridgeRequestPlan(scenarioId);
      } catch (error) {
        failures.push({
          scenarioId,
          gateStatus: "missing-private-root-bridge-request-plan",
          error: error.message
        });
      }
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

function formatScenarioModeKey({ modeId, scenarioId }) {
  return `${modeId}:${scenarioId}`;
}

function sum(values, getValue) {
  return values.reduce((total, value) => total + getValue(value), 0);
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
