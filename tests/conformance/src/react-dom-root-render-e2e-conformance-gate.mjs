import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
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

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_GATE_ID =
  "root-render-private-bridge-dual-run-gate-1";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_MATCH_STATUS =
  "matched-private-root-bridge-request-record";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_BRIDGE_BLOCKED_STATUS =
  "blocked-private-root-bridge-request-row";

export const REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_GATE_ID =
  "react-dom-portal-root-render-blocked-gate-1";

export const REACT_DOM_PORTAL_ROOT_RENDER_OBJECT_ACCEPTED_STATUS =
  "accepted-create-portal-object-record";

export const REACT_DOM_PORTAL_ROOT_RENDER_RECONCILER_DIAGNOSTIC_STATUS =
  "accepted-reconciler-portal-fail-closed-diagnostic";

export const REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_STATUS =
  "blocked-portal-root-render";

export const REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_BOUNDARY_ROWS =
  Object.freeze([
    Object.freeze({
      id: "portal-public-root-render",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_STATUS,
      compatibilityClaimed: false,
      reason:
        "createPortal object construction is accepted, but rendering a portal through public React DOM roots is blocked until public root render and reconciler portal admission can hand off safely."
    }),
    Object.freeze({
      id: "portal-mounting",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_STATUS,
      compatibilityClaimed: false,
      reason:
        "Portal container mounting is not implemented; the accepted reconciler diagnostic must fail closed before mounting portal children."
    }),
    Object.freeze({
      id: "portal-listener-setup",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_STATUS,
      compatibilityClaimed: false,
      reason:
        "Portal listener setup and preparePortalMount behavior remain unsupported and must not be inferred from createPortal object construction."
    }),
    Object.freeze({
      id: "portal-dom-mutation",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_STATUS,
      compatibilityClaimed: false,
      reason:
        "Portal DOM mutation remains blocked; the local gate checks only create-only object behavior and fail-closed diagnostics."
    }),
    Object.freeze({
      id: "portal-compatibility-claim",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_STATUS,
      compatibilityClaimed: false,
      reason:
        "React DOM portal root-render compatibility is not claimed while mounting, listeners, DOM mutation, and public roots are blocked."
    })
  ]);

export const REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_GATE = Object.freeze({
  id: REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_GATE_ID,
  reactDomPortalOracle: `${REACT_DOM_ROOT_RENDER_E2E_TARGET.packageName}@${REACT_DOM_ROOT_RENDER_E2E_TARGET.version}`,
  reactDomRootRenderE2EOracle: `${REACT_DOM_ROOT_RENDER_E2E_TARGET.packageName}@${REACT_DOM_ROOT_RENDER_E2E_TARGET.version}`,
  localTargetPackageName: REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET.packageName,
  acceptedPrerequisiteStatuses: Object.freeze([
    REACT_DOM_PORTAL_ROOT_RENDER_OBJECT_ACCEPTED_STATUS,
    REACT_DOM_PORTAL_ROOT_RENDER_RECONCILER_DIAGNOSTIC_STATUS
  ]),
  blockedBoundaryRows: REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_BOUNDARY_ROWS,
  unsupportedBehavior: Object.freeze({
    gateStatus: REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_STATUS,
    portalMountingAvailable: false,
    portalListenerSetupAvailable: false,
    portalDomMutationAvailable: false,
    compatibilityClaimed: false
  })
});

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
      inspectReactDomRootRenderE2EPrivateBridgeRequests({ workspaceRoot }),
    portalRootRenderObservations: inspectReactDomPortalRootRenderBlockedBoundary({
      workspaceRoot
    })
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
  currentOracle,
  privateBridgeObservations =
    inspectReactDomRootRenderE2EPrivateBridgeRequests(),
  portalRootRenderObservations =
    inspectReactDomPortalRootRenderBlockedBoundary()
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

  const portalRootRenderGate = evaluateReactDomPortalRootRenderBlockedGate({
    checkedOracle,
    currentOracle,
    portalRootRenderObservations,
    rootRenderBlockedScenarioModeRows: blocked
  });
  failures.push(...portalRootRenderGate.failures);

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
    portalRootRenderGate,
    portalRootRenderPrerequisiteRows: portalRootRenderGate.prerequisiteRows,
    portalRootRenderBlockedRows: portalRootRenderGate.blockedRows,
    failures,
    summary: {
      admittedScenarioModeRowCount: admitted.length,
      blockedScenarioModeRowCount: blocked.length,
      privateBridgeComparableScenarioModeRowCount:
        privateBridgeComparableRows.length,
      privateBridgeBlockedScenarioModeRowCount:
        privateBridgeBlockedRows.length,
      portalRootRenderPrerequisiteRowCount:
        portalRootRenderGate.summary.prerequisiteRowCount,
      portalRootRenderBlockedRowCount:
        portalRootRenderGate.summary.blockedRowCount,
      failureCount: failures.length,
      totalScenarioModeRowCount:
        REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length *
        REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length,
      compatibilityAdmitted:
        failures.length === 0 &&
        blocked.length === 0 &&
        admitted.length > 0,
      privateBridgeCompatibilityClaimed: false,
      portalRootRenderCompatibilityClaimed: false,
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

export function evaluateReactDomPortalRootRenderBlockedGate({
  checkedOracle,
  currentOracle,
  portalRootRenderObservations =
    inspectReactDomPortalRootRenderBlockedBoundary(),
  rootRenderBlockedScenarioModeRows = null
} = {}) {
  const failures = [];
  const prerequisiteRows = [];
  const blockedRows = [];

  validatePortalRootRenderOracleTie({
    checkedOracle,
    currentOracle,
    rootRenderBlockedScenarioModeRows,
    failures
  });
  validatePortalCreateOnlyBoundary({
    portalRootRenderObservations,
    prerequisiteRows,
    failures
  });
  validatePortalReconcilerFailClosedDiagnostics({
    portalRootRenderObservations,
    prerequisiteRows,
    failures
  });
  validatePortalUnsupportedRows({
    portalRootRenderObservations,
    blockedRows,
    failures
  });

  if (blockedRows.length > 0 && checkedOracle && currentOracle) {
    rejectCompatibilityClaimsWhileBlocked({
      checkedOracle,
      currentOracle,
      failures
    });
  }

  return {
    gate: REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_GATE,
    ok: failures.length === 0,
    prerequisiteRows,
    blockedRows,
    portalRootRenderObservations,
    failures,
    summary: {
      prerequisiteRowCount: prerequisiteRows.length,
      blockedRowCount: blockedRows.length,
      rootRenderE2EScenarioModeRowCount:
        REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length *
        REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length,
      failureCount: failures.length,
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
    `Portal root-render prerequisite rows accepted: ${result.summary.portalRootRenderPrerequisiteRowCount}`,
    `Portal root-render rows blocked: ${result.summary.portalRootRenderBlockedRowCount}`,
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
  if (result.portalRootRenderBlockedRows.length > 0) {
    lines.push(
      "Portal root-render rows remain separate from public root compatibility; createPortal object shape and reconciler fail-closed diagnostics are tracked without mounting portals."
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

export function inspectReactDomPortalRootRenderBlockedBoundary({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  try {
    const reactDom = require(join(workspaceRoot, "packages/react-dom/index.js"));
    const createPortalShared = require(
      join(workspaceRoot, "packages/react-dom/src/shared/create-portal.js")
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

    const ownerDocument = createGateDocument("portal-root-render", domContainer);
    const rootContainer = createGateElement("DIV", ownerDocument, domContainer);
    const portalContainer = createGateElement(
      "SECTION",
      ownerDocument,
      domContainer
    );
    const portalChild = {
      props: {
        children: "portal child"
      },
      type: "span"
    };

    const publicPortal = reactDom.createPortal(
      portalChild,
      portalContainer,
      "portal-key"
    );
    const privateRecord =
      createPortalShared.createPortalRecordFromNormalizedParts(
        "normalized-key",
        portalChild,
        portalContainer,
        createPortalShared.reactDomPortalImplementation
      );
    const unsupportedImplementation = attemptGateOperation(
      "createPortal unsupported implementation",
      () =>
        createPortalShared.createPortalObject(
          portalChild,
          portalContainer,
          {
            renderer: "dom"
          },
          "unsupported-key"
        )
    );

    return {
      loadError: null,
      publicCreatePortalExport: describeLocalFunction(reactDom.createPortal),
      publicPortal: summarizePortalObject(publicPortal, {
        expectedChildren: portalChild,
        expectedContainer: portalContainer
      }),
      privateRecord: summarizePortalObject(privateRecord, {
        expectedChildren: portalChild,
        expectedContainer: portalContainer
      }),
      unsupportedImplementation,
      portalCreationSideEffects: summarizePortalRootRenderSideEffects({
        containers: [rootContainer, portalContainer],
        documents: [ownerDocument],
        listenerRegistry,
        rootMarkers
      }),
      reconcilerDiagnostics: inspectPortalReconcilerFailClosedDiagnostics({
        workspaceRoot
      })
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

function validatePortalRootRenderOracleTie({
  checkedOracle,
  currentOracle,
  rootRenderBlockedScenarioModeRows,
  failures
}) {
  validateOracleShape({
    checkedOracle,
    currentOracle,
    failures
  });
  if (!checkedOracle || !currentOracle) {
    return;
  }

  const portalScenarioIds = REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.filter(
    (scenarioId) => scenarioId.includes("portal")
  );
  if (portalScenarioIds.length > 0) {
    failures.push({
      gateStatus: "portal-scenarios-admitted-to-public-root-e2e-oracle",
      scenarioIds: portalScenarioIds
    });
  }

  const expectedScenarioModeRowCount =
    REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length *
    REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length;

  if (
    rootRenderBlockedScenarioModeRows &&
    rootRenderBlockedScenarioModeRows.length !== expectedScenarioModeRowCount
  ) {
    failures.push({
      gateStatus: "portal-root-render-public-blocked-row-count-mismatch",
      actual: rootRenderBlockedScenarioModeRows.length,
      expected: expectedScenarioModeRowCount
    });
  }

  let unsupportedComparisonCount = 0;
  for (const mode of REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES) {
    for (const scenarioId of REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS) {
      const checkedReactObservation = findObservation({
        oracle: checkedOracle,
        modeId: mode.id,
        packageName: REACT_DOM_ROOT_RENDER_E2E_TARGET.packageName,
        scenarioId
      });
      const comparison = findComparison({
        oracle: currentOracle,
        modeId: mode.id,
        scenarioId
      });

      if (checkedReactObservation?.result?.result?.status !== "ok") {
        failures.push({
          modeId: mode.id,
          scenarioId,
          gateStatus: "portal-root-render-react-oracle-row-not-accepted",
          status: checkedReactObservation?.result?.result?.status ?? null
        });
      }

      if (
        comparison?.status === "unsupported-placeholder" &&
        comparison.compatibilityClaimed === false
      ) {
        unsupportedComparisonCount += 1;
      } else {
        failures.push({
          modeId: mode.id,
          scenarioId,
          gateStatus: "portal-root-render-public-comparison-not-blocked",
          status: comparison?.status ?? null,
          compatibilityClaimed: comparison?.compatibilityClaimed ?? null
        });
      }
    }
  }

  if (unsupportedComparisonCount !== expectedScenarioModeRowCount) {
    failures.push({
      gateStatus: "portal-root-render-public-comparison-count-mismatch",
      actual: unsupportedComparisonCount,
      expected: expectedScenarioModeRowCount
    });
  }
}

function validatePortalCreateOnlyBoundary({
  portalRootRenderObservations,
  prerequisiteRows,
  failures
}) {
  if (portalRootRenderObservations.loadError) {
    failures.push({
      gateStatus: "portal-root-render-boundary-load-failed",
      error: portalRootRenderObservations.loadError
    });
    return;
  }

  if (
    portalRootRenderObservations.publicCreatePortalExport.type !== "function" ||
    portalRootRenderObservations.publicCreatePortalExport.length !== 2
  ) {
    failures.push({
      gateStatus: "portal-create-portal-export-shape-mismatch",
      exportInfo: portalRootRenderObservations.publicCreatePortalExport
    });
  }

  if (
    isAcceptedPortalSummary(
      portalRootRenderObservations.publicPortal,
      "portal-key"
    )
  ) {
    prerequisiteRows.push({
      id: "accepted-public-create-portal-object",
      gateStatus: REACT_DOM_PORTAL_ROOT_RENDER_OBJECT_ACCEPTED_STATUS,
      comparedToAcceptedReactDomOracle: true,
      compatibilityClaimed: false
    });
  } else {
    failures.push({
      gateStatus: "portal-public-object-shape-mismatch",
      portal: portalRootRenderObservations.publicPortal
    });
  }

  if (
    isAcceptedPortalSummary(
      portalRootRenderObservations.privateRecord,
      "normalized-key"
    )
  ) {
    prerequisiteRows.push({
      id: "accepted-private-create-portal-record",
      gateStatus: REACT_DOM_PORTAL_ROOT_RENDER_OBJECT_ACCEPTED_STATUS,
      comparedToAcceptedReactDomOracle: false,
      compatibilityClaimed: false
    });
  } else {
    failures.push({
      gateStatus: "portal-private-record-shape-mismatch",
      portal: portalRootRenderObservations.privateRecord
    });
  }

  const unsupportedImplementation =
    portalRootRenderObservations.unsupportedImplementation;
  if (
    unsupportedImplementation.status !== "throws" ||
    unsupportedImplementation.thrown.code !==
      "FAST_REACT_DOM_PORTAL_IMPLEMENTATION_UNSUPPORTED"
  ) {
    failures.push({
      gateStatus: "portal-private-implementation-not-fail-closed",
      unsupportedImplementation
    });
  }

  if (
    !isPortalRootRenderSideEffectFree(
      portalRootRenderObservations.portalCreationSideEffects
    )
  ) {
    failures.push({
      gateStatus: "portal-create-only-boundary-produced-side-effects",
      sideEffects: portalRootRenderObservations.portalCreationSideEffects
    });
  }
}

function validatePortalReconcilerFailClosedDiagnostics({
  portalRootRenderObservations,
  prerequisiteRows,
  failures
}) {
  if (portalRootRenderObservations.loadError) {
    return;
  }

  const diagnostics = portalRootRenderObservations.reconcilerDiagnostics;
  if (diagnostics.loadError) {
    failures.push({
      gateStatus: "portal-reconciler-diagnostic-source-load-failed",
      error: diagnostics.loadError
    });
    return;
  }

  if (
    diagnostics.beginWorkUnsupportedFeatureConstantPresent &&
    diagnostics.beginWorkUnsupportedPortalRecordPresent &&
    diagnostics.beginWorkErrorVariantPresent &&
    diagnostics.beginWorkPortalTagGuardPresent
  ) {
    prerequisiteRows.push({
      id: "accepted-reconciler-begin-work-portal-diagnostic",
      gateStatus: REACT_DOM_PORTAL_ROOT_RENDER_RECONCILER_DIAGNOSTIC_STATUS,
      compatibilityClaimed: false
    });
  } else {
    failures.push({
      gateStatus: "portal-reconciler-begin-work-diagnostic-missing",
      diagnostics
    });
  }

  if (
    diagnostics.rootPreflightErrorVariantPresent &&
    diagnostics.rootPreflightPortalTagGuardPresent &&
    diagnostics.rootPreflightNoDelegationTestPresent
  ) {
    prerequisiteRows.push({
      id: "accepted-reconciler-root-preflight-portal-diagnostic",
      gateStatus: REACT_DOM_PORTAL_ROOT_RENDER_RECONCILER_DIAGNOSTIC_STATUS,
      compatibilityClaimed: false
    });
  } else {
    failures.push({
      gateStatus: "portal-reconciler-root-preflight-diagnostic-missing",
      diagnostics
    });
  }
}

function validatePortalUnsupportedRows({
  portalRootRenderObservations,
  blockedRows,
  failures
}) {
  if (portalRootRenderObservations.loadError) {
    return;
  }

  if (
    !isPortalRootRenderSideEffectFree(
      portalRootRenderObservations.portalCreationSideEffects
    )
  ) {
    return;
  }

  for (const row of REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_BOUNDARY_ROWS) {
    blockedRows.push({
      id: row.id,
      gateStatus: row.expectedGateStatus,
      admission: row.admission,
      compatibilityClaimed: false,
      portalRootRenderSurface: "react-dom-createPortal-through-root-render",
      publicRootCompatibilitySurface: false,
      rootRenderE2EScenarioModeRowCount:
        REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length *
        REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length,
      reason: row.reason
    });
  }

  if (
    blockedRows.some(
      (row) => row.gateStatus !== REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_STATUS
    )
  ) {
    failures.push({
      gateStatus: "portal-root-render-blocked-row-status-mismatch"
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

function summarizePortalObject(portal, { expectedChildren, expectedContainer }) {
  return {
    brand: {
      description: portal?.$$typeof?.description ?? null,
      keyFor:
        typeof portal?.$$typeof === "symbol"
          ? Symbol.keyFor(portal.$$typeof)
          : null,
      stringValue:
        typeof portal?.$$typeof === "symbol" ? String(portal.$$typeof) : null
    },
    childrenIdentityPreserved: portal?.children === expectedChildren,
    containerInfoIdentityPreserved: portal?.containerInfo === expectedContainer,
    implementation: describeLocalValue(portal?.implementation),
    key: describeLocalValue(portal?.key),
    objectKeys: Object.keys(portal ?? {}),
    ownKeys: Reflect.ownKeys(portal ?? {}).map(describePropertyKey),
    type: describeLocalValue(portal)
  };
}

function summarizePortalRootRenderSideEffects({
  containers,
  documents,
  listenerRegistry,
  rootMarkers
}) {
  const containerMarkerPropertyCount = sum(
    containers,
    (container) => rootMarkers.inspectContainerRootMarker(container).propertyCount
  );
  const containerListeningMarkerPropertyCount = sum(
    containers,
    (container) => listenerRegistry.inspectListeningMarker(container).propertyCount
  );
  const ownerDocumentListeningMarkerPropertyCount = sum(
    documents,
    (document) => listenerRegistry.inspectListeningMarker(document).propertyCount
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
    listenerInstallationObserved:
      containerListenerRegistrationCount > 0 ||
      ownerDocumentListenerRegistrationCount > 0 ||
      containerListeningMarkerPropertyCount > 0 ||
      ownerDocumentListeningMarkerPropertyCount > 0,
    markerWriteObserved: containerMarkerPropertyCount > 0,
    ownerDocumentListenerRegistrationCount,
    ownerDocumentListeningMarkerPropertyCount,
    ownerDocumentMutationCount,
    portalMountingObserved: false,
    publicRootCompatibilityClaimed: false
  };
}

function inspectPortalReconcilerFailClosedDiagnostics({ workspaceRoot }) {
  try {
    const beginWorkSource = readWorkspaceFile(
      workspaceRoot,
      "crates/fast-react-reconciler/src/begin_work.rs"
    );
    const rootWorkLoopSource = readWorkspaceFile(
      workspaceRoot,
      "crates/fast-react-reconciler/src/root_work_loop.rs"
    );

    return {
      loadError: null,
      beginWorkErrorVariantPresent:
        /BeginWorkError[\s\S]*UnsupportedPortal/u.test(beginWorkSource),
      beginWorkPortalTagGuardPresent:
        /FiberTag::Portal/u.test(beginWorkSource) &&
        /unsupported_portal_begin_work_record/u.test(beginWorkSource),
      beginWorkUnsupportedFeatureConstantPresent:
        /PORTAL_RECONCILER_UNSUPPORTED_FEATURE/u.test(beginWorkSource),
      beginWorkUnsupportedPortalRecordPresent:
        /UnsupportedPortalBeginWorkRecord/u.test(beginWorkSource),
      rootPreflightErrorVariantPresent:
        /HostRootChildBeginWorkPreflightError[\s\S]*UnsupportedPortal/u.test(
          rootWorkLoopSource
        ),
      rootPreflightNoDelegationTestPresent:
        /root_work_loop_preflight_fails_closed_for_portal_child_without_delegating_or_mounting/u.test(
          rootWorkLoopSource
        ),
      rootPreflightPortalTagGuardPresent:
        /child_tag == FiberTag::Portal/u.test(rootWorkLoopSource) &&
        /unsupported_portal_begin_work_record/u.test(rootWorkLoopSource)
    };
  } catch (error) {
    return {
      loadError: serializeGateError(error)
    };
  }
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

function describePropertyKey(key) {
  if (typeof key === "symbol") {
    return {
      description: key.description ?? null,
      keyFor: Symbol.keyFor(key),
      type: "symbol"
    };
  }

  return {
    type: "string",
    value: key
  };
}

function readWorkspaceFile(workspaceRoot, relativePath) {
  return readFileSync(join(workspaceRoot, relativePath), "utf8");
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

function isAcceptedPortalSummary(portal, expectedKey) {
  return (
    portal?.brand?.keyFor === "react.portal" &&
    portal.brand.description === "react.portal" &&
    portal.brand.stringValue === "Symbol(react.portal)" &&
    portal.childrenIdentityPreserved === true &&
    portal.containerInfoIdentityPreserved === true &&
    portal.implementation.type === "null" &&
    portal.key.type === "string" &&
    portal.key.value === expectedKey &&
    findFirstDifferencePath(
      portal.objectKeys,
      ["$$typeof", "key", "children", "containerInfo", "implementation"]
    ) === null &&
    findFirstDifferencePath(
      portal.ownKeys,
      [
        { type: "string", value: "$$typeof" },
        { type: "string", value: "key" },
        { type: "string", value: "children" },
        { type: "string", value: "containerInfo" },
        { type: "string", value: "implementation" }
      ]
    ) === null
  );
}

function isPortalRootRenderSideEffectFree(sideEffects) {
  return (
    sideEffects?.compatibilityClaimed === false &&
    sideEffects.publicRootCompatibilityClaimed === false &&
    sideEffects.portalMountingObserved === false &&
    sideEffects.domMutationObserved === false &&
    sideEffects.listenerInstallationObserved === false &&
    sideEffects.markerWriteObserved === false &&
    sideEffects.containerListenerRegistrationCount === 0 &&
    sideEffects.containerListeningMarkerPropertyCount === 0 &&
    sideEffects.containerMarkerPropertyCount === 0 &&
    sideEffects.containerMutationCount === 0 &&
    sideEffects.ownerDocumentListenerRegistrationCount === 0 &&
    sideEffects.ownerDocumentListeningMarkerPropertyCount === 0 &&
    sideEffects.ownerDocumentMutationCount === 0
  );
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
