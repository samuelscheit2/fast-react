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
  REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_BLOCKED_STATUS,
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

export const REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS =
  Object.freeze([
    Object.freeze({
      id: "public-create-root-render-initial",
      publicApi: "react-dom/client.createRoot(container).render(element)",
      scenarioId: "initial-host-render",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateBridgeEvidence: "separate"
    }),
    Object.freeze({
      id: "public-create-root-render-update",
      publicApi:
        "react-dom/client.createRoot(container).render(updatedElement)",
      scenarioId: "update-host-render",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateBridgeEvidence: "separate"
    }),
    Object.freeze({
      id: "public-create-root-unmount-call",
      publicApi: "react-dom/client.createRoot(container).unmount()",
      scenarioId: "root-unmount",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateBridgeEvidence: "separate"
    })
  ]);

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
      id: "public-hydration",
      publicApi: "hydration through react-dom/client.hydrateRoot",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateBridgeEvidence: "separate"
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
    ...REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS,
    Object.freeze({
      id: "public-portal-root-render",
      publicApi: "ReactDOM.createPortal(...) through public root.render",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateHostOutputEvidence: "separate",
      privatePortalMetadataPromotesPublicRootRender: false,
      portalRootRenderEvidence: "separate"
    }),
    Object.freeze({
      id: "public-development-warning-compatibility",
      publicApi: "development warning output through public root APIs",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateWarningBoundaryEvidence: "separate"
    }),
    Object.freeze({
      id: "public-flush-sync-cross-root-compatibility",
      publicApi: "ReactDOM.flushSync across public roots",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateCrossRootSchedulingEvidence: "separate"
    }),
    Object.freeze({
      id: "public-act-passive-root-render-compatibility",
      publicApi: "React act/passive effects through public React DOM roots",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateActPassiveEvidence: "separate"
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

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_GATE_ID =
  "root-render-private-host-output-diagnostic-gate-1";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS =
  "accepted-private-root-host-output-diagnostic";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_BLOCKED_STATUS =
  "blocked-private-root-host-output-diagnostic";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_GATE_ID =
  "root-render-private-warning-boundary-diagnostic-gate-1";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_ACCEPTED_STATUS =
  "accepted-private-root-warning-boundary-diagnostic";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_BLOCKED_STATUS =
  "blocked-private-root-warning-boundary-diagnostic";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_GATE_ID =
  "root-render-private-cross-root-scheduling-diagnostic-gate-1";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ACCEPTED_STATUS =
  "accepted-private-cross-root-scheduling-diagnostic";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_BLOCKED_STATUS =
  "blocked-private-cross-root-scheduling-diagnostic";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_GATE_ID =
  "root-render-private-act-passive-diagnostic-gate-1";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ACCEPTED_STATUS =
  "accepted-private-root-act-passive-diagnostic";

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_BLOCKED_STATUS =
  "blocked-private-root-act-passive-diagnostic";

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
        "Public portal container mounting is not implemented; accepted private fake-DOM portal mount diagnostics remain separate from public root.render compatibility."
    }),
    Object.freeze({
      id: "portal-listener-setup",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_STATUS,
      compatibilityClaimed: false,
      reason:
        "Portal listener setup and preparePortalMount behavior remain unsupported publicly and must not be inferred from private listener-intent or event owner-root metadata."
    }),
    Object.freeze({
      id: "portal-dom-mutation",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_STATUS,
      compatibilityClaimed: false,
      reason:
        "Browser/public portal DOM mutation remains blocked; private fake-DOM mount and child reconciliation diagnostics cannot promote public root rendering compatibility."
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

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ADMISSIONS =
  Object.freeze([
    {
      scenarioId: "create-root-no-render",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "The private root bridge can apply and revert explicit createRoot marker/listener diagnostics without exposing a public root object or mutating host children."
    },
    {
      scenarioId: "initial-host-render",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "Private fake-DOM HostComponent/HostText helpers can produce initial host output behind a private render request while public createRoot remains blocked."
    },
    {
      scenarioId: "update-host-render",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "Private fake-DOM property/text mutation helpers can update host output and publish latest props only after mutation handoff validation."
    },
    {
      scenarioId: "replace-host-tree",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "Private fake-DOM removal and placement helpers can replace the root host child while detaching the old latest-props mapping."
    },
    {
      scenarioId: "render-null-clears-container",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "Private fake-DOM clearContainer and component-tree detach helpers can clear mounted host output while the private root marker/listener gate remains active."
    },
    {
      scenarioId: "root-unmount",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "Private unmount diagnostics can clear fake host output and revert explicit createRoot marker/listener side effects without admitting public root unmount behavior."
    },
    {
      scenarioId: "double-unmount",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "Private fake-DOM unmount diagnostics can prove the first unmount clears host output and the second private unmount records no additional host mutation."
    },
    {
      scenarioId: "render-after-unmount",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "Private fake-DOM unmount diagnostics can prove the stale render guard throws after host output is cleared without mutating the container again."
    },
    {
      scenarioId: "flush-sync-cross-root-render",
      admission: "private-host-output-diagnostic",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
      reason:
        "Private flushSync guard, reconciler cross-root sync-flush diagnostics, and fake-DOM host-output helpers prove two private root.render requests can be flushed and committed together without admitting public flushSync behavior."
    },
    ...REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.filter(
      (scenarioId) =>
        ![
          "create-root-no-render",
          "initial-host-render",
          "update-host-render",
          "replace-host-tree",
          "render-null-clears-container",
          "root-unmount",
          "double-unmount",
          "render-after-unmount",
          "flush-sync-cross-root-render"
        ].includes(scenarioId)
    ).map((scenarioId) => ({
      scenarioId,
      admission: "unsupported",
      gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_BLOCKED_STATUS,
      reason:
        "This root E2E scenario still needs private warning-boundary evidence before it can be admitted as a host-output diagnostic row."
    }))
  ]);

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_ADMISSIONS =
  Object.freeze(
    REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.map((scenarioId) =>
      scenarioId === "development-warning-boundaries"
        ? Object.freeze({
            scenarioId,
            admission: "private-warning-boundary-diagnostic",
            gateStatus:
              REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_ACCEPTED_STATUS,
            reason:
              "Private root records can prove the development warning argument boundaries without comparing console output or admitting public root warning compatibility."
          })
        : Object.freeze({
            scenarioId,
            admission: "unsupported",
            gateStatus:
              REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_BLOCKED_STATUS,
            reason:
              "This root E2E scenario is not a warning-boundary diagnostic row; its public behavior remains blocked by the root-render facade gate."
          })
    )
  );

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ADMISSIONS =
  Object.freeze(
    REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.map((scenarioId) =>
      scenarioId === "flush-sync-cross-root-render"
        ? Object.freeze({
            scenarioId,
            admission: "private-cross-root-scheduling-diagnostic",
            gateStatus:
              REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ACCEPTED_STATUS,
            reason:
              "Private bridge records, the private flushSync guard, and reconciler cross-root sync-flush diagnostics prove two scheduled roots are flushed together without admitting public flushSync or public root compatibility."
          })
        : Object.freeze({
            scenarioId,
            admission: "unsupported",
            gateStatus:
              REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_BLOCKED_STATUS,
            reason:
              "This root E2E scenario is not cross-root scheduling evidence; its public behavior remains blocked by the root-render facade gate."
          })
    )
  );

export const REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ADMISSIONS =
  Object.freeze(
    REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.map((scenarioId) =>
      Object.freeze({
        scenarioId,
        admission: "private-act-passive-diagnostic",
        gateStatus: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ACCEPTED_STATUS,
        reason:
          "Private React act, React DOM test-utils act, and reconciler passive diagnostics are admitted only as metadata/source evidence while public root render, public act, and scheduler-driven passive effect compatibility remain blocked."
      })
    )
  );

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
    privateHostOutputDiagnostics:
      inspectReactDomRootRenderE2EPrivateHostOutputDiagnostics({
        workspaceRoot
      }),
    privateWarningBoundaryDiagnostics:
      inspectReactDomRootRenderE2EPrivateWarningBoundaryDiagnostics({
        workspaceRoot
      }),
    privateCrossRootSchedulingDiagnostics:
      inspectReactDomRootRenderE2EPrivateCrossRootSchedulingDiagnostics({
        workspaceRoot
      }),
    privateActPassiveDiagnostics:
      inspectReactDomRootRenderE2EPrivateActPassiveDiagnostics({
        workspaceRoot
      }),
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
  privateHostOutputDiagnostics =
    inspectReactDomRootRenderE2EPrivateHostOutputDiagnostics(),
  privateWarningBoundaryDiagnostics =
    inspectReactDomRootRenderE2EPrivateWarningBoundaryDiagnostics(),
  privateCrossRootSchedulingDiagnostics =
    inspectReactDomRootRenderE2EPrivateCrossRootSchedulingDiagnostics(),
  privateActPassiveDiagnostics =
    inspectReactDomRootRenderE2EPrivateActPassiveDiagnostics(),
  portalRootRenderObservations =
    inspectReactDomPortalRootRenderBlockedBoundary()
}) {
  const failures = [];
  const admitted = [];
  const blocked = [];
  const privateBridgeComparableRows = [];
  const privateBridgeBlockedRows = [];
  const privateHostOutputDiagnosticRows = [];
  const privateHostOutputBlockedRows = [];
  const privateWarningBoundaryDiagnosticRows = [];
  const privateWarningBoundaryBlockedRows = [];
  const privateCrossRootSchedulingDiagnosticRows = [];
  const privateCrossRootSchedulingBlockedRows = [];
  const privateActPassiveDiagnosticRows = [];
  const privateActPassiveBlockedRows = [];
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
  const privateHostOutputAdmissionByScenario = new Map(
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ADMISSIONS.map(
      (admission) => [admission.scenarioId, admission]
    )
  );
  const privateHostOutputObservationByRow = new Map(
    (privateHostOutputDiagnostics.rows ?? []).map((row) => [
      formatScenarioModeKey(row),
      row
    ])
  );
  const privateWarningBoundaryAdmissionByScenario = new Map(
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_ADMISSIONS.map(
      (admission) => [admission.scenarioId, admission]
    )
  );
  const privateWarningBoundaryObservationByRow = new Map(
    (privateWarningBoundaryDiagnostics.rows ?? []).map((row) => [
      formatScenarioModeKey(row),
      row
    ])
  );
  const privateCrossRootSchedulingAdmissionByScenario = new Map(
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ADMISSIONS.map(
      (admission) => [admission.scenarioId, admission]
    )
  );
  const privateCrossRootSchedulingObservationByRow = new Map(
    (privateCrossRootSchedulingDiagnostics.rows ?? []).map((row) => [
      formatScenarioModeKey(row),
      row
    ])
  );
  const privateActPassiveAdmissionByScenario = new Map(
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ADMISSIONS.map(
      (admission) => [admission.scenarioId, admission]
    )
  );
  const privateActPassiveObservationByRow = new Map(
    (privateActPassiveDiagnostics.rows ?? []).map((row) => [
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
  validatePrivateHostOutputAdmissionMetadata({
    privateHostOutputAdmissionByScenario,
    failures
  });
  validatePrivateWarningBoundaryAdmissionMetadata({
    privateWarningBoundaryAdmissionByScenario,
    failures
  });
  validatePrivateCrossRootSchedulingAdmissionMetadata({
    privateCrossRootSchedulingAdmissionByScenario,
    failures
  });
  validatePrivateActPassiveAdmissionMetadata({
    privateActPassiveAdmissionByScenario,
    failures
  });

  if (privateBridgeObservations.loadError) {
    failures.push({
      gateStatus: "private-root-bridge-request-observation-load-failed",
      error: privateBridgeObservations.loadError
    });
  }
  if (privateHostOutputDiagnostics.loadError) {
    failures.push({
      gateStatus: "private-root-host-output-diagnostic-load-failed",
      error: privateHostOutputDiagnostics.loadError
    });
  }
  if (privateWarningBoundaryDiagnostics.loadError) {
    failures.push({
      gateStatus: "private-root-warning-boundary-diagnostic-load-failed",
      error: privateWarningBoundaryDiagnostics.loadError
    });
  }
  if (privateCrossRootSchedulingDiagnostics.loadError) {
    failures.push({
      gateStatus: "private-cross-root-scheduling-diagnostic-load-failed",
      error: privateCrossRootSchedulingDiagnostics.loadError
    });
  }
  if (privateActPassiveDiagnostics.loadError) {
    failures.push({
      gateStatus: "private-root-act-passive-diagnostic-load-failed",
      error: privateActPassiveDiagnostics.loadError
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
      } else if (privateAdmission.admission === "private-request-comparable") {
        const privateObservation = privateBridgeObservationByRow.get(
          formatScenarioModeKey(context)
        );

        if (!privateObservation) {
          failures.push({
            ...context,
            gateStatus: "missing-private-root-bridge-request-observation"
          });
        } else if (privateObservation.status !== "ok") {
          failures.push({
            ...context,
            gateStatus: "private-root-bridge-request-observation-failed",
            status: privateObservation.status,
            error: privateObservation.error ?? null
          });
        } else {
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
        }
      } else if (privateAdmission.admission === "unsupported") {
        privateBridgeBlockedRows.push({
          ...context,
          gateStatus: privateAdmission.gateStatus,
          oracleRowAccepted,
          publicFacadeGateStatus: behavior.gateStatus,
          reason: privateAdmission.reason,
          comparedToReactDomOracle: false,
          compatibilityClaimed: false
        });
      } else {
        failures.push({
          ...context,
          gateStatus: "unknown-private-root-bridge-request-admission",
          admission: privateAdmission.admission
        });
      }

      const privateWarningBoundaryAdmission =
        privateWarningBoundaryAdmissionByScenario.get(scenarioId);
      if (!privateWarningBoundaryAdmission) {
        failures.push({
          ...context,
          gateStatus: "missing-private-root-warning-boundary-admission"
        });
      } else if (
        privateWarningBoundaryAdmission.admission ===
        "private-warning-boundary-diagnostic"
      ) {
        const privateWarningBoundaryObservation =
          privateWarningBoundaryObservationByRow.get(
            formatScenarioModeKey(context)
          );

        if (!privateWarningBoundaryObservation) {
          failures.push({
            ...context,
            gateStatus: "missing-private-root-warning-boundary-diagnostic"
          });
        } else {
          const validationFailure =
            validatePrivateWarningBoundaryDiagnosticObservation({
              mode,
              observation: privateWarningBoundaryObservation,
              scenarioId
            });

          if (validationFailure === null) {
            privateWarningBoundaryDiagnosticRows.push({
              ...context,
              gateStatus: privateWarningBoundaryAdmission.gateStatus,
              oracleRowAccepted,
              publicFacadeGateStatus: behavior.gateStatus,
              publicRootCompatibilitySurface: false,
              comparedToReactDomOracle: false,
              compatibilityClaimed: false,
              consoleOutputUsedAsEvidence: false,
              diagnosticKind:
                privateWarningBoundaryObservation.evidence.diagnosticKind,
              modeWarningEnabled:
                privateWarningBoundaryObservation.evidence.modeWarningEnabled,
              warningBoundaryEvidence:
                privateWarningBoundaryObservation.evidence
                  .warningBoundaryEvidence
            });
          } else {
            failures.push({
              ...context,
              ...validationFailure
            });
          }
        }
      } else if (privateWarningBoundaryAdmission.admission === "unsupported") {
        privateWarningBoundaryBlockedRows.push({
          ...context,
          gateStatus: privateWarningBoundaryAdmission.gateStatus,
          oracleRowAccepted,
          publicFacadeGateStatus: behavior.gateStatus,
          publicRootCompatibilitySurface: false,
          reason: privateWarningBoundaryAdmission.reason,
          comparedToReactDomOracle: false,
          compatibilityClaimed: false,
          consoleOutputUsedAsEvidence: false
        });
      } else {
        failures.push({
          ...context,
          gateStatus: "unknown-private-root-warning-boundary-admission",
          admission: privateWarningBoundaryAdmission.admission
        });
      }

      const privateCrossRootSchedulingAdmission =
        privateCrossRootSchedulingAdmissionByScenario.get(scenarioId);
      if (!privateCrossRootSchedulingAdmission) {
        failures.push({
          ...context,
          gateStatus: "missing-private-cross-root-scheduling-admission"
        });
      } else if (
        privateCrossRootSchedulingAdmission.admission ===
        "private-cross-root-scheduling-diagnostic"
      ) {
        const privateCrossRootSchedulingObservation =
          privateCrossRootSchedulingObservationByRow.get(
            formatScenarioModeKey(context)
          );

        if (!privateCrossRootSchedulingObservation) {
          failures.push({
            ...context,
            gateStatus: "missing-private-cross-root-scheduling-diagnostic"
          });
        } else {
          const validationFailure =
            validatePrivateCrossRootSchedulingDiagnosticObservation({
              observation: privateCrossRootSchedulingObservation,
              scenarioId
            });

          if (validationFailure === null) {
            privateCrossRootSchedulingDiagnosticRows.push({
              ...context,
              gateStatus: privateCrossRootSchedulingAdmission.gateStatus,
              oracleRowAccepted,
              publicFacadeGateStatus: behavior.gateStatus,
              publicRootCompatibilitySurface: false,
              comparedToReactDomOracle: false,
              compatibilityClaimed: false,
              publicFlushSyncCompatibilityClaimed: false,
              diagnosticKind:
                privateCrossRootSchedulingObservation.evidence.diagnosticKind,
              rootBridgeEvidence:
                privateCrossRootSchedulingObservation.evidence
                  .rootBridgeEvidence,
              rootSideEffectEvidence:
                privateCrossRootSchedulingObservation.evidence
                  .rootSideEffectEvidence,
              schedulingEvidence:
                privateCrossRootSchedulingObservation.evidence
                  .schedulingEvidence
            });
          } else {
            failures.push({
              ...context,
              ...validationFailure
            });
          }
        }
      } else if (
        privateCrossRootSchedulingAdmission.admission === "unsupported"
      ) {
        privateCrossRootSchedulingBlockedRows.push({
          ...context,
          gateStatus: privateCrossRootSchedulingAdmission.gateStatus,
          oracleRowAccepted,
          publicFacadeGateStatus: behavior.gateStatus,
          publicRootCompatibilitySurface: false,
          reason: privateCrossRootSchedulingAdmission.reason,
          comparedToReactDomOracle: false,
          compatibilityClaimed: false,
          publicFlushSyncCompatibilityClaimed: false
        });
      } else {
        failures.push({
          ...context,
          gateStatus: "unknown-private-cross-root-scheduling-admission",
          admission: privateCrossRootSchedulingAdmission.admission
        });
      }

      const privateActPassiveAdmission =
        privateActPassiveAdmissionByScenario.get(scenarioId);
      if (!privateActPassiveAdmission) {
        failures.push({
          ...context,
          gateStatus: "missing-private-root-act-passive-admission"
        });
      } else if (
        privateActPassiveAdmission.admission ===
        "private-act-passive-diagnostic"
      ) {
        const privateActPassiveObservation =
          privateActPassiveObservationByRow.get(formatScenarioModeKey(context));

        if (!privateActPassiveObservation) {
          failures.push({
            ...context,
            gateStatus: "missing-private-root-act-passive-diagnostic"
          });
        } else {
          const validationFailure =
            validatePrivateActPassiveDiagnosticObservation({
              observation: privateActPassiveObservation
            });

          if (validationFailure === null) {
            privateActPassiveDiagnosticRows.push({
              ...context,
              gateStatus: privateActPassiveAdmission.gateStatus,
              oracleRowAccepted,
              publicFacadeGateStatus: behavior.gateStatus,
              publicRootCompatibilitySurface: false,
              comparedToReactDomOracle: false,
              compatibilityClaimed: false,
              publicReactActCompatibilityClaimed: false,
              publicReactDomTestUtilsActCompatibilityClaimed: false,
              publicRootRenderCompatibilityClaimed: false,
              publicPassiveEffectCompatibilityClaimed: false,
              diagnosticKind:
                privateActPassiveObservation.evidence.diagnosticKind,
              actEvidence: privateActPassiveObservation.evidence.actEvidence,
              passiveEvidence:
                privateActPassiveObservation.evidence.passiveEvidence,
              blockedPublicPrerequisites:
                privateActPassiveObservation.evidence
                  .blockedPublicPrerequisites,
              sourceDiagnostics:
                privateActPassiveObservation.evidence.sourceDiagnostics
            });
          } else {
            failures.push({
              ...context,
              ...validationFailure
            });
          }
        }
      } else if (privateActPassiveAdmission.admission === "unsupported") {
        privateActPassiveBlockedRows.push({
          ...context,
          gateStatus: privateActPassiveAdmission.gateStatus,
          oracleRowAccepted,
          publicFacadeGateStatus: behavior.gateStatus,
          publicRootCompatibilitySurface: false,
          reason: privateActPassiveAdmission.reason,
          comparedToReactDomOracle: false,
          compatibilityClaimed: false,
          publicReactActCompatibilityClaimed: false,
          publicReactDomTestUtilsActCompatibilityClaimed: false,
          publicRootRenderCompatibilityClaimed: false,
          publicPassiveEffectCompatibilityClaimed: false
        });
      } else {
        failures.push({
          ...context,
          gateStatus: "unknown-private-root-act-passive-admission",
          admission: privateActPassiveAdmission.admission
        });
      }

      const privateHostOutputAdmission =
        privateHostOutputAdmissionByScenario.get(scenarioId);
      if (!privateHostOutputAdmission) {
        failures.push({
          ...context,
          gateStatus: "missing-private-root-host-output-admission"
        });
        continue;
      }

      if (
        privateHostOutputAdmission.admission ===
        "private-host-output-diagnostic"
      ) {
        const privateHostOutputObservation =
          privateHostOutputObservationByRow.get(formatScenarioModeKey(context));

        if (!privateHostOutputObservation) {
          failures.push({
            ...context,
            gateStatus: "missing-private-root-host-output-diagnostic"
          });
          continue;
        }

        const validationFailure =
          validatePrivateHostOutputDiagnosticObservation({
            observation: privateHostOutputObservation,
            scenarioId
          });

        if (validationFailure === null) {
          privateHostOutputDiagnosticRows.push({
            ...context,
            gateStatus: privateHostOutputAdmission.gateStatus,
            oracleRowAccepted,
            publicFacadeGateStatus: behavior.gateStatus,
            publicRootCompatibilitySurface: false,
            comparedToReactDomOracle: false,
            compatibilityClaimed: false,
            diagnosticKind:
              privateHostOutputObservation.evidence.diagnosticKind,
            hostOutputEvidence:
              privateHostOutputObservation.evidence.hostOutputEvidence,
            rootBridgeEvidence:
              privateHostOutputObservation.evidence.rootBridgeEvidence,
            rootSideEffectEvidence:
              privateHostOutputObservation.evidence.rootSideEffectEvidence
          });
        } else {
          failures.push({
            ...context,
            ...validationFailure
          });
        }
        continue;
      }

      if (privateHostOutputAdmission.admission === "unsupported") {
        privateHostOutputBlockedRows.push({
          ...context,
          gateStatus: privateHostOutputAdmission.gateStatus,
          oracleRowAccepted,
          publicFacadeGateStatus: behavior.gateStatus,
          publicRootCompatibilitySurface: false,
          reason: privateHostOutputAdmission.reason,
          comparedToReactDomOracle: false,
          compatibilityClaimed: false
        });
        continue;
      }

      failures.push({
        ...context,
        gateStatus: "unknown-private-root-host-output-admission",
        admission: privateHostOutputAdmission.admission
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
    privateHostOutputGate: {
      id: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_GATE_ID,
      localEntrypoint:
        "packages/react-dom/src/client/root-bridge.js + packages/react-dom/src/dom-host/mutation.js private diagnostics",
      admittedPrivateHostOutputScenarioIds:
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ADMISSIONS.filter(
          (admission) =>
            admission.admission === "private-host-output-diagnostic"
        ).map((admission) => admission.scenarioId),
      unsupportedPrivateHostOutputScenarioIds:
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ADMISSIONS.filter(
          (admission) => admission.admission === "unsupported"
        ).map((admission) => admission.scenarioId),
      compatibilityClaimed: false
    },
    privateWarningBoundaryGate: {
      id: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_GATE_ID,
      localEntrypoint:
        "packages/react-dom/src/client/root-bridge.js + packages/react-dom/src/client/root-markers.js private warning-boundary diagnostics",
      admittedPrivateWarningBoundaryScenarioIds:
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_ADMISSIONS.filter(
          (admission) =>
            admission.admission === "private-warning-boundary-diagnostic"
        ).map((admission) => admission.scenarioId),
      unsupportedPrivateWarningBoundaryScenarioIds:
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_ADMISSIONS.filter(
          (admission) => admission.admission === "unsupported"
        ).map((admission) => admission.scenarioId),
      consoleOutputUsedAsEvidence: false,
      compatibilityClaimed: false
    },
    privateCrossRootSchedulingGate: {
      id: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_GATE_ID,
      localEntrypoint:
        "packages/react-dom/src/client/root-bridge.js + packages/react-dom/src/shared/flush-sync-guard.js + crates/fast-react-reconciler/src/sync_flush.rs private diagnostics",
      admittedPrivateCrossRootSchedulingScenarioIds:
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ADMISSIONS.filter(
          (admission) =>
            admission.admission ===
            "private-cross-root-scheduling-diagnostic"
        ).map((admission) => admission.scenarioId),
      unsupportedPrivateCrossRootSchedulingScenarioIds:
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ADMISSIONS.filter(
          (admission) => admission.admission === "unsupported"
        ).map((admission) => admission.scenarioId),
      publicFlushSyncCompatibilityClaimed: false,
      compatibilityClaimed: false
    },
    privateActPassiveGate: {
      id: REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_GATE_ID,
      localEntrypoint:
        "packages/react/private-act-dispatcher-gate.js + packages/react-dom/src/test-utils-act-gate.js + crates/fast-react-reconciler/src/passive_effects.rs private diagnostics",
      admittedPrivateActPassiveScenarioIds:
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ADMISSIONS.filter(
          (admission) =>
            admission.admission === "private-act-passive-diagnostic"
        ).map((admission) => admission.scenarioId),
      unsupportedPrivateActPassiveScenarioIds:
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ADMISSIONS.filter(
          (admission) => admission.admission === "unsupported"
        ).map((admission) => admission.scenarioId),
      publicReactActCompatibilityClaimed: false,
      publicReactDomTestUtilsActCompatibilityClaimed: false,
      publicRootRenderCompatibilityClaimed: false,
      publicPassiveEffectCompatibilityClaimed: false,
      compatibilityClaimed: false
    },
    privateHostOutputDiagnosticScenarioModeRows:
      privateHostOutputDiagnosticRows,
    privateHostOutputBlockedScenarioModeRows: privateHostOutputBlockedRows,
    privateWarningBoundaryDiagnosticScenarioModeRows:
      privateWarningBoundaryDiagnosticRows,
    privateWarningBoundaryBlockedScenarioModeRows:
      privateWarningBoundaryBlockedRows,
    privateCrossRootSchedulingDiagnosticScenarioModeRows:
      privateCrossRootSchedulingDiagnosticRows,
    privateCrossRootSchedulingBlockedScenarioModeRows:
      privateCrossRootSchedulingBlockedRows,
    privateActPassiveDiagnosticScenarioModeRows:
      privateActPassiveDiagnosticRows,
    privateActPassiveBlockedScenarioModeRows: privateActPassiveBlockedRows,
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
      privateHostOutputDiagnosticScenarioModeRowCount:
        privateHostOutputDiagnosticRows.length,
      privateHostOutputBlockedScenarioModeRowCount:
        privateHostOutputBlockedRows.length,
      privateWarningBoundaryDiagnosticScenarioModeRowCount:
        privateWarningBoundaryDiagnosticRows.length,
      privateWarningBoundaryBlockedScenarioModeRowCount:
        privateWarningBoundaryBlockedRows.length,
      privateCrossRootSchedulingDiagnosticScenarioModeRowCount:
        privateCrossRootSchedulingDiagnosticRows.length,
      privateCrossRootSchedulingBlockedScenarioModeRowCount:
        privateCrossRootSchedulingBlockedRows.length,
      privateActPassiveDiagnosticScenarioModeRowCount:
        privateActPassiveDiagnosticRows.length,
      privateActPassiveBlockedScenarioModeRowCount:
        privateActPassiveBlockedRows.length,
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
      privateHostOutputCompatibilityClaimed: false,
      privateWarningBoundaryCompatibilityClaimed: false,
      privateWarningBoundaryConsoleOutputUsedAsEvidence: false,
      privateCrossRootSchedulingCompatibilityClaimed: false,
      privateCrossRootSchedulingPublicFlushSyncCompatibilityClaimed: false,
      privateActPassiveCompatibilityClaimed: false,
      privateActPassivePublicReactActCompatibilityClaimed: false,
      privateActPassivePublicReactDomTestUtilsActCompatibilityClaimed: false,
      privateActPassivePublicRootRenderCompatibilityClaimed: false,
      privateActPassivePublicPassiveEffectCompatibilityClaimed: false,
      privatePortalMetadataPromotesPublicRootRender:
        portalRootRenderGate.summary.privatePortalMetadataPromotesPublicRootRender,
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
  privateRootBridgeBoundary = inspectReactDomPrivateRootBridgeBoundary(),
  rootRenderGateResult: providedRootRenderGateResult = null
} = {}) {
  const failures = [];
  const blockedScenarioModeRows = [];
  const blockedPublicFacadeRows = [];
  const blockedPrivateBridgeRows = [];

  const rootRenderGateResult =
    providedRootRenderGateResult ??
    (checkedOracle && currentOracle
      ? evaluateReactDomRootRenderE2EConformanceGate({
          checkedOracle,
          currentOracle
        })
      : null);

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
  validatePortalPrivateRootBridgeDiagnostics({
    portalRootRenderObservations,
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
      privatePortalMetadataPromotesPublicRootRender: false,
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
    `Private host-output diagnostic rows admitted: ${result.summary.privateHostOutputDiagnosticScenarioModeRowCount}`,
    `Private host-output diagnostic rows blocked: ${result.summary.privateHostOutputBlockedScenarioModeRowCount}`,
    `Private warning-boundary diagnostic rows admitted: ${result.summary.privateWarningBoundaryDiagnosticScenarioModeRowCount}`,
    `Private warning-boundary diagnostic rows blocked: ${result.summary.privateWarningBoundaryBlockedScenarioModeRowCount}`,
    `Private cross-root scheduling diagnostic rows admitted: ${result.summary.privateCrossRootSchedulingDiagnosticScenarioModeRowCount}`,
    `Private cross-root scheduling diagnostic rows blocked: ${result.summary.privateCrossRootSchedulingBlockedScenarioModeRowCount}`,
    `Private act/passive diagnostic rows admitted: ${result.summary.privateActPassiveDiagnosticScenarioModeRowCount}`,
    `Private act/passive diagnostic rows blocked: ${result.summary.privateActPassiveBlockedScenarioModeRowCount}`,
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
  if (result.privateHostOutputDiagnosticScenarioModeRows.length > 0) {
    lines.push(
      "Private host-output diagnostics use fake-DOM helper evidence only; public root render scenarios and compatibility claims remain blocked."
    );
  }
  if (result.privateWarningBoundaryDiagnosticScenarioModeRows.length > 0) {
    lines.push(
      "Private warning-boundary diagnostics use root record metadata only; console output and public development warning compatibility remain blocked."
    );
  }
  if (result.privateCrossRootSchedulingDiagnosticScenarioModeRows.length > 0) {
    lines.push(
      "Private cross-root scheduling diagnostics use private bridge, flush guard, and reconciler canary evidence only; public flushSync and public root compatibility remain blocked."
    );
  }
  if (result.privateActPassiveDiagnosticScenarioModeRows.length > 0) {
    lines.push(
      "Private act/passive diagnostics use accepted metadata and source evidence only; public React act, React DOM test-utils act, passive effects, and public root compatibility remain blocked."
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
    `Root-render private host-output diagnostic rows admitted: ${
      result.rootRenderGate?.summary
        .privateHostOutputDiagnosticScenarioModeRowCount ?? 0
    }`,
    `Root-render private host-output diagnostic rows blocked: ${
      result.rootRenderGate?.summary
        .privateHostOutputBlockedScenarioModeRowCount ?? 0
    }`,
    `Root-render private warning-boundary diagnostic rows admitted: ${
      result.rootRenderGate?.summary
        .privateWarningBoundaryDiagnosticScenarioModeRowCount ?? 0
    }`,
    `Root-render private warning-boundary diagnostic rows blocked: ${
      result.rootRenderGate?.summary
        .privateWarningBoundaryBlockedScenarioModeRowCount ?? 0
    }`,
    `Root-render private cross-root scheduling diagnostic rows admitted: ${
      result.rootRenderGate?.summary
        .privateCrossRootSchedulingDiagnosticScenarioModeRowCount ?? 0
    }`,
    `Root-render private cross-root scheduling diagnostic rows blocked: ${
      result.rootRenderGate?.summary
        .privateCrossRootSchedulingBlockedScenarioModeRowCount ?? 0
    }`,
    `Root-render private act/passive diagnostic rows admitted: ${
      result.rootRenderGate?.summary
        .privateActPassiveDiagnosticScenarioModeRowCount ?? 0
    }`,
    `Root-render private act/passive diagnostic rows blocked: ${
      result.rootRenderGate?.summary
        .privateActPassiveBlockedScenarioModeRowCount ?? 0
    }`,
    `Root-render portal rows blocked: ${
      result.rootRenderGate?.summary.portalRootRenderBlockedRowCount ?? 0
    }`,
    `Failures: ${result.summary.failureCount}`
  ];

  if (result.summary.blockedPublicFacadeRowCount > 0) {
    lines.push(
      "Compatibility remains blocked; public createRoot/hydrateRoot/root lifecycle behavior is still placeholder-only."
    );
  }
  if (result.summary.blockedPrivateBridgeRowCount > 0) {
    lines.push(
      "Private root-bridge request and admission rows remain metadata-only and are not public compatibility evidence."
    );
  }
  if (
    (result.rootRenderGate?.summary
      .privateHostOutputDiagnosticScenarioModeRowCount ?? 0) > 0
  ) {
    lines.push(
      "Private host-output diagnostics remain fake-DOM evidence only and do not unblock public root facade rows."
    );
  }
  if (
    (result.rootRenderGate?.summary
      .privateWarningBoundaryDiagnosticScenarioModeRowCount ?? 0) > 0
  ) {
    lines.push(
      "Private warning-boundary diagnostics remain metadata evidence only and do not unblock public warning compatibility."
    );
  }
  if (
    (result.rootRenderGate?.summary
      .privateCrossRootSchedulingDiagnosticScenarioModeRowCount ?? 0) > 0
  ) {
    lines.push(
      "Private cross-root scheduling diagnostics remain private flush evidence only and do not unblock public flushSync or public root compatibility."
    );
  }
  if (
    (result.rootRenderGate?.summary
      .privateActPassiveDiagnosticScenarioModeRowCount ?? 0) > 0
  ) {
    lines.push(
      "Private act/passive diagnostics remain metadata evidence only and do not unblock public act, passive effect, or public root compatibility."
    );
  }
  if ((result.rootRenderGate?.summary.portalRootRenderBlockedRowCount ?? 0) > 0) {
    lines.push(
      "Portal root-render blockers remain fail-closed; public root rendering, portal mounting, listeners, DOM mutation, and compatibility claims are still blocked."
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
    const publicRootLifecycle = inspectReactDomRootPublicFacadeLifecycle({
      domContainer,
      listenerRegistry,
      reactDomClient,
      rootMarkers
    });

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
      hydrateRoot,
      publicRootLifecycle
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

export function inspectReactDomRootRenderE2EPrivateHostOutputDiagnostics({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  try {
    const modules = loadPrivateHostOutputModules(workspaceRoot);
    const rows = [];

    for (const mode of REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES) {
      for (const admission of REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ADMISSIONS) {
        if (admission.admission !== "private-host-output-diagnostic") {
          continue;
        }

        rows.push(
          runPrivateHostOutputDiagnosticScenario({
            mode,
            modules,
            scenarioId: admission.scenarioId
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

export function inspectReactDomRootRenderE2EPrivateWarningBoundaryDiagnostics({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  try {
    const modules = loadPrivateBridgeModules(workspaceRoot);
    const rows = [];

    for (const mode of REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES) {
      for (const admission of REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_ADMISSIONS) {
        if (admission.admission !== "private-warning-boundary-diagnostic") {
          continue;
        }

        rows.push(
          runPrivateWarningBoundaryDiagnosticScenario({
            mode,
            modules,
            scenarioId: admission.scenarioId
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

export function inspectReactDomRootRenderE2EPrivateCrossRootSchedulingDiagnostics({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  try {
    const modules = loadPrivateCrossRootSchedulingModules(workspaceRoot);
    const rows = [];

    for (const mode of REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES) {
      for (const admission of REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ADMISSIONS) {
        if (
          admission.admission !==
          "private-cross-root-scheduling-diagnostic"
        ) {
          continue;
        }

        rows.push(
          runPrivateCrossRootSchedulingDiagnosticScenario({
            mode,
            modules,
            scenarioId: admission.scenarioId
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

export function inspectReactDomRootRenderE2EPrivateActPassiveDiagnostics({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  try {
    const modules = loadPrivateActPassiveModules(workspaceRoot);
    const rows = [];

    for (const mode of REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES) {
      for (const admission of REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ADMISSIONS) {
        if (admission.admission !== "private-act-passive-diagnostic") {
          continue;
        }

        rows.push(
          runPrivateActPassiveDiagnosticScenario({
            mode,
            modules,
            scenarioId: admission.scenarioId
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
    const admissions = {
      create: summarizePrivateRootBridgeAdmissionRecord(
        bridge.admitRequest(create)
      ),
      render: summarizePrivateRootBridgeAdmissionRecord(
        bridge.admitRequest(render)
      ),
      unmount: summarizePrivateRootBridgeAdmissionRecord(
        bridge.admitRequest(unmount)
      ),
      secondUnmount: summarizePrivateRootBridgeAdmissionRecord(
        bridge.admitRequest(secondUnmount)
      )
    };

    return {
      loadError: null,
      create: summarizePrivateRootBridgeCreateRecord(create),
      render: summarizePrivateRootBridgeUpdateRecord(render),
      unmount: summarizePrivateRootBridgeUpdateRecord(unmount),
      secondUnmount: summarizePrivateRootBridgeUpdateRecord(secondUnmount),
      admissions,
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
    const rootBridge = require(
      join(workspaceRoot, "packages/react-dom/src/client/root-bridge.js")
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
    const bridge = rootBridge.createPrivateRootBridgeShell({
      portalBoundaryIdPrefix: "portal-boundary",
      requestIdPrefix: "portal-request",
      rootIdPrefix: "portal-root",
      updateIdPrefix: "portal-update"
    });
    const createRootRecord = bridge.createClientRoot(rootContainer);
    const portalRenderRecord = bridge.renderContainer(
      createRootRecord.handle,
      publicPortal
    );
    const portalRootBoundaryRecord =
      bridge.createPortalRootBoundary(portalRenderRecord);
    const portalRootBoundaryPayload =
      rootBridge.getPrivateRootPortalBoundaryPayload(
        portalRootBoundaryRecord
      );
    const nonPortalRenderRecord = bridge.renderContainer(
      createRootRecord.handle,
      {
        props: {
          children: "not a portal"
        },
        type: "div"
      }
    );
    const invalidPortalRootBoundary = attemptGateOperation(
      "private portal root boundary rejects non-portal render payload",
      () => bridge.createPortalRootBoundary(nonPortalRenderRecord)
    );
    const privatePortalDiagnostics =
      inspectPrivateRootBridgePortalDiagnostics({
        domContainer,
        reactDom,
        rootBridge,
        rootMarkers,
        listenerRegistry
      });

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
      privateRootBridgePortalBoundary:
        summarizePrivateRootPortalBoundaryRecord(portalRootBoundaryRecord),
      privateRootBridgePortalBoundaryPayload: {
        portalChildrenMatches:
          portalRootBoundaryPayload?.portalChildren === portalChild,
        portalContainerMatches:
          portalRootBoundaryPayload?.portalContainer === portalContainer,
        portalMatches: portalRootBoundaryPayload?.portal === publicPortal,
        rootHandleMatches:
          portalRootBoundaryPayload?.rootHandle === createRootRecord.handle,
        sourceRecordMatches:
          portalRootBoundaryPayload?.sourceRecord === portalRenderRecord
      },
      privateRootBridgePortalRequest: {
        admission: summarizePrivateRootBridgeAdmissionRecord(
          bridge.admitRequest(portalRenderRecord)
        ),
        render: summarizePrivateRootBridgeUpdateRecord(portalRenderRecord)
      },
      invalidPortalRootBoundary,
      privateRootBridgePortalDiagnostics: privatePortalDiagnostics,
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

function inspectPrivateRootBridgePortalDiagnostics({
  domContainer,
  listenerRegistry,
  reactDom,
  rootBridge,
  rootMarkers
}) {
  const document = createPrivateHostOutputDocument({
    domContainer,
    label: "portal-root-render-private-diagnostics"
  });
  const rootContainer = document.createElement("div");
  const portalContainer = document.createElement("section");
  const portalChild = {
    props: {
      children: "portal child"
    },
    type: "span"
  };
  const updatedPortalChild = {
    props: {
      children: "updated portal child",
      "data-phase": "updated",
      title: "updated title"
    },
    type: "span"
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: "portal-diagnostic-boundary",
    portalChildReconciliationIdPrefix: "portal-diagnostic-child",
    portalCommitIdPrefix: "portal-diagnostic-commit",
    portalEventOwnerRootIdPrefix: "portal-diagnostic-owner",
    portalMountIdPrefix: "portal-diagnostic-mount",
    portalPrepareMountListenerIdPrefix: "portal-diagnostic-listener",
    requestIdPrefix: "portal-diagnostic-request",
    rootIdPrefix: "portal-diagnostic-root",
    sideEffectIdPrefix: "portal-diagnostic-side-effect",
    updateIdPrefix: "portal-diagnostic-update"
  });

  const createRootRecord = bridge.createClientRoot(rootContainer);
  const sideEffects = bridge.applyCreateRootSideEffects(createRootRecord);
  const portal = reactDom.createPortal(
    portalChild,
    portalContainer,
    "portal-key"
  );
  const renderRecord = bridge.renderContainer(
    createRootRecord.handle,
    portal
  );
  const boundaryRecord = bridge.createPortalRootBoundary(renderRecord);
  const prepareMountListenerIntent =
    bridge.createPortalPrepareMountListenerIntent(boundaryRecord);
  const commitHandoff = bridge.createPortalCommitHandoff(boundaryRecord, {
    pendingChildren: [portalChild]
  });
  const fakeDomMount = bridge.createPortalFakeDomMountDiagnostic(
    commitHandoff,
    {
      explicitChild: portalChild
    }
  );
  const eventOwnerRootGate =
    bridge.createPortalEventOwnerRootGate(fakeDomMount);
  const updatedPortal = reactDom.createPortal(
    updatedPortalChild,
    portalContainer,
    "portal-key"
  );
  const updateRenderRecord = bridge.renderContainer(
    createRootRecord.handle,
    updatedPortal
  );
  const updateBoundaryRecord =
    bridge.createPortalRootBoundary(updateRenderRecord);
  const childReconciliation =
    bridge.createPortalChildReconciliationDiagnostic(
      fakeDomMount,
      updateBoundaryRecord,
      {
        explicitChild: updatedPortalChild
      }
    );
  const sideEffectCleanup = bridge.revertCreateRootSideEffects(sideEffects);

  const prepareMountListenerPayload =
    rootBridge.getPrivateRootPortalPrepareMountListenerIntentPayload(
      prepareMountListenerIntent
    );
  const fakeDomMountPayload =
    rootBridge.getPrivateRootPortalFakeDomMountPayload(fakeDomMount);
  const eventOwnerRootPayload =
    rootBridge.getPrivateRootPortalEventOwnerRootGatePayload(
      eventOwnerRootGate
    );
  const childReconciliationPayload =
    rootBridge.getPrivateRootPortalChildReconciliationDiagnosticPayload(
      childReconciliation
    );

  return {
    status: "ok",
    prepareMountListenerIntent:
      summarizePrivateRootPortalPrepareMountListenerIntentRecord(
        prepareMountListenerIntent
      ),
    fakeDomMount:
      summarizePrivateRootPortalFakeDomMountRecord(fakeDomMount),
    eventOwnerRootGate:
      summarizePrivateRootPortalEventOwnerRootGateRecord(eventOwnerRootGate),
    childReconciliation:
      summarizePrivateRootPortalChildReconciliationRecord(
        childReconciliation
      ),
    payloadsHidden: {
      childBoundaryMatches:
        childReconciliationPayload?.boundaryRecord === updateBoundaryRecord,
      childMountMatches:
        childReconciliationPayload?.mountRecord === fakeDomMount,
      childNextChildMatches:
        childReconciliationPayload?.nextChild === updatedPortalChild,
      eventMountMatches:
        eventOwnerRootPayload?.mountRecord === fakeDomMount,
      mountCommitMatches:
        fakeDomMountPayload?.commitHandoffRecord === commitHandoff,
      mountPortalContainerMatches:
        fakeDomMountPayload?.portalContainer === portalContainer,
      prepareBoundaryMatches:
        prepareMountListenerPayload?.boundaryRecord === boundaryRecord,
      preparePortalContainerMatches:
        prepareMountListenerPayload?.portalContainer === portalContainer
    },
    sideEffects: summarizePrivateRootPortalDiagnosticSideEffects({
      document,
      listenerRegistry,
      portalContainer,
      rootContainer,
      rootMarkers,
      sideEffectCleanup
    })
  };
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

  validateRootRenderPrivateHostOutputBlockers({
    rootRenderGateResult,
    failures
  });
  validateRootRenderPrivateWarningBoundaryBlockers({
    rootRenderGateResult,
    failures
  });
  validateRootRenderPrivateCrossRootSchedulingBlockers({
    rootRenderGateResult,
    failures
  });
  validateRootRenderPrivateActPassiveBlockers({
    rootRenderGateResult,
    failures
  });
  validateRootRenderPortalBlockers({
    rootRenderGateResult,
    failures
  });
}

function validateRootRenderPrivateHostOutputBlockers({
  rootRenderGateResult,
  failures
}) {
  if (!rootRenderGateResult) {
    return;
  }

  const admittedScenarioIds =
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ADMISSIONS.filter(
      (admission) => admission.admission === "private-host-output-diagnostic"
    ).map((admission) => admission.scenarioId);
  const unsupportedScenarioIds =
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ADMISSIONS.filter(
      (admission) => admission.admission === "unsupported"
    ).map((admission) => admission.scenarioId);
  const expectedAdmittedRows =
    admittedScenarioIds.length * REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length;
  const expectedBlockedRows =
    unsupportedScenarioIds.length * REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length;

  if (
    rootRenderGateResult.summary.privateHostOutputDiagnosticScenarioModeRowCount !==
      expectedAdmittedRows ||
    rootRenderGateResult.summary.privateHostOutputBlockedScenarioModeRowCount !==
      expectedBlockedRows
  ) {
    failures.push({
      gateStatus: "root-render-private-host-output-row-count-mismatch",
      actualAdmitted:
        rootRenderGateResult.summary
          .privateHostOutputDiagnosticScenarioModeRowCount ?? null,
      actualBlocked:
        rootRenderGateResult.summary
          .privateHostOutputBlockedScenarioModeRowCount ?? null,
      expectedAdmitted: expectedAdmittedRows,
      expectedBlocked: expectedBlockedRows
    });
  }

  if (
    rootRenderGateResult.summary.privateHostOutputCompatibilityClaimed !==
      false ||
    rootRenderGateResult.privateHostOutputGate?.compatibilityClaimed !== false
  ) {
    failures.push({
      gateStatus:
        "root-render-private-host-output-claims-compatibility-while-public-facade-blocked",
      summaryClaim:
        rootRenderGateResult.summary.privateHostOutputCompatibilityClaimed ??
        null,
      gateClaim:
        rootRenderGateResult.privateHostOutputGate?.compatibilityClaimed ?? null
    });
  }

  if (
    findFirstDifferencePath(
      rootRenderGateResult.privateHostOutputGate
        ?.admittedPrivateHostOutputScenarioIds ?? [],
      admittedScenarioIds
    ) !== null ||
    findFirstDifferencePath(
      rootRenderGateResult.privateHostOutputGate
        ?.unsupportedPrivateHostOutputScenarioIds ?? [],
      unsupportedScenarioIds
    ) !== null
  ) {
    failures.push({
      gateStatus: "root-render-private-host-output-admission-set-mismatch",
      admitted:
        rootRenderGateResult.privateHostOutputGate
          ?.admittedPrivateHostOutputScenarioIds ?? null,
      unsupported:
        rootRenderGateResult.privateHostOutputGate
          ?.unsupportedPrivateHostOutputScenarioIds ?? null
    });
  }

  for (const row of rootRenderGateResult.privateHostOutputDiagnosticScenarioModeRows ??
    []) {
    if (
      row.gateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS ||
      row.publicFacadeGateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_BLOCKED_STATUS ||
      row.publicRootCompatibilitySurface !== false ||
      row.comparedToReactDomOracle !== false ||
      row.compatibilityClaimed !== false ||
      row.diagnosticKind !== "private-fake-dom-root-host-output"
    ) {
      failures.push({
        modeId: row.modeId,
        scenarioId: row.scenarioId,
        gateStatus: "root-render-private-host-output-row-not-private-blocked",
        row
      });
      continue;
    }

    const rootBridgeAdmissions = row.rootBridgeEvidence?.admissions ?? [];
    const rootBridgeHandoffs = row.rootBridgeEvidence?.nativeHandoffs ?? [];
    if (
      rootBridgeAdmissions.some(
        (admission) =>
          admission.admissionStatus !==
            "admitted-private-root-bridge-request-record" ||
          admission.executionStatus !==
            "blocked-private-root-bridge-execution" ||
          admission.compatibilityClaimed !== false
      ) ||
      rootBridgeHandoffs.some(
        (handoff) =>
          handoff.nativeExecution !== false ||
          handoff.reconcilerExecution !== false ||
          handoff.domMutation !== false ||
          handoff.compatibilityClaimed !== false
      )
    ) {
      failures.push({
        modeId: row.modeId,
        scenarioId: row.scenarioId,
        gateStatus:
          "root-render-private-host-output-bridge-evidence-not-record-only",
        rootBridgeEvidence: row.rootBridgeEvidence
      });
    }
  }

  for (const row of rootRenderGateResult.privateHostOutputBlockedScenarioModeRows ??
    []) {
    if (
      row.gateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_BLOCKED_STATUS ||
      row.publicFacadeGateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_BLOCKED_STATUS ||
      row.publicRootCompatibilitySurface !== false ||
      row.comparedToReactDomOracle !== false ||
      row.compatibilityClaimed !== false
    ) {
      failures.push({
        modeId: row.modeId,
        scenarioId: row.scenarioId,
        gateStatus:
          "root-render-private-host-output-blocked-row-not-fail-closed",
        row
      });
    }
  }
}

function validateRootRenderPrivateWarningBoundaryBlockers({
  rootRenderGateResult,
  failures
}) {
  if (!rootRenderGateResult) {
    return;
  }

  const admittedScenarioIds =
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_ADMISSIONS.filter(
      (admission) =>
        admission.admission === "private-warning-boundary-diagnostic"
    ).map((admission) => admission.scenarioId);
  const unsupportedScenarioIds =
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_ADMISSIONS.filter(
      (admission) => admission.admission === "unsupported"
    ).map((admission) => admission.scenarioId);
  const expectedAdmittedRows =
    admittedScenarioIds.length * REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length;
  const expectedBlockedRows =
    unsupportedScenarioIds.length *
    REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length;

  if (
    rootRenderGateResult.summary
      .privateWarningBoundaryDiagnosticScenarioModeRowCount !==
      expectedAdmittedRows ||
    rootRenderGateResult.summary
      .privateWarningBoundaryBlockedScenarioModeRowCount !== expectedBlockedRows
  ) {
    failures.push({
      gateStatus: "root-render-private-warning-boundary-row-count-mismatch",
      actualAdmitted:
        rootRenderGateResult.summary
          .privateWarningBoundaryDiagnosticScenarioModeRowCount ?? null,
      actualBlocked:
        rootRenderGateResult.summary
          .privateWarningBoundaryBlockedScenarioModeRowCount ?? null,
      expectedAdmitted: expectedAdmittedRows,
      expectedBlocked: expectedBlockedRows
    });
  }

  if (
    rootRenderGateResult.summary.privateWarningBoundaryCompatibilityClaimed !==
      false ||
    rootRenderGateResult.summary
      .privateWarningBoundaryConsoleOutputUsedAsEvidence !== false ||
    rootRenderGateResult.privateWarningBoundaryGate?.compatibilityClaimed !==
      false ||
    rootRenderGateResult.privateWarningBoundaryGate
      ?.consoleOutputUsedAsEvidence !== false
  ) {
    failures.push({
      gateStatus:
        "root-render-private-warning-boundary-claims-compatibility-while-public-facade-blocked",
      summaryClaim:
        rootRenderGateResult.summary.privateWarningBoundaryCompatibilityClaimed ??
        null,
      summaryConsoleEvidence:
        rootRenderGateResult.summary
          .privateWarningBoundaryConsoleOutputUsedAsEvidence ?? null,
      gateClaim:
        rootRenderGateResult.privateWarningBoundaryGate?.compatibilityClaimed ??
        null,
      gateConsoleEvidence:
        rootRenderGateResult.privateWarningBoundaryGate
          ?.consoleOutputUsedAsEvidence ?? null
    });
  }

  if (
    findFirstDifferencePath(
      rootRenderGateResult.privateWarningBoundaryGate
        ?.admittedPrivateWarningBoundaryScenarioIds ?? [],
      admittedScenarioIds
    ) !== null ||
    findFirstDifferencePath(
      rootRenderGateResult.privateWarningBoundaryGate
        ?.unsupportedPrivateWarningBoundaryScenarioIds ?? [],
      unsupportedScenarioIds
    ) !== null
  ) {
    failures.push({
      gateStatus:
        "root-render-private-warning-boundary-admission-set-mismatch",
      admitted:
        rootRenderGateResult.privateWarningBoundaryGate
          ?.admittedPrivateWarningBoundaryScenarioIds ?? null,
      unsupported:
        rootRenderGateResult.privateWarningBoundaryGate
          ?.unsupportedPrivateWarningBoundaryScenarioIds ?? null
    });
  }

  for (const row of rootRenderGateResult.privateWarningBoundaryDiagnosticScenarioModeRows ??
    []) {
    if (
      row.gateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_ACCEPTED_STATUS ||
      row.scenarioId !== "development-warning-boundaries" ||
      row.publicFacadeGateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_BLOCKED_STATUS ||
      row.publicRootCompatibilitySurface !== false ||
      row.comparedToReactDomOracle !== false ||
      row.compatibilityClaimed !== false ||
      row.consoleOutputUsedAsEvidence !== false ||
      row.diagnosticKind !== "private-root-warning-boundary"
    ) {
      failures.push({
        modeId: row.modeId,
        scenarioId: row.scenarioId,
        gateStatus: "root-render-private-warning-boundary-row-not-private",
        row
      });
    }
  }

  for (const row of rootRenderGateResult.privateWarningBoundaryBlockedScenarioModeRows ??
    []) {
    if (
      row.gateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_BLOCKED_STATUS ||
      row.publicFacadeGateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_BLOCKED_STATUS ||
      row.publicRootCompatibilitySurface !== false ||
      row.comparedToReactDomOracle !== false ||
      row.compatibilityClaimed !== false ||
      row.consoleOutputUsedAsEvidence !== false
    ) {
      failures.push({
        modeId: row.modeId,
        scenarioId: row.scenarioId,
        gateStatus:
          "root-render-private-warning-boundary-blocked-row-not-fail-closed",
        row
      });
    }
  }
}

function validateRootRenderPrivateCrossRootSchedulingBlockers({
  rootRenderGateResult,
  failures
}) {
  if (!rootRenderGateResult) {
    return;
  }

  const admittedScenarioIds =
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ADMISSIONS.filter(
      (admission) =>
        admission.admission === "private-cross-root-scheduling-diagnostic"
    ).map((admission) => admission.scenarioId);
  const unsupportedScenarioIds =
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ADMISSIONS.filter(
      (admission) => admission.admission === "unsupported"
    ).map((admission) => admission.scenarioId);
  const expectedAdmittedRows =
    admittedScenarioIds.length * REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length;
  const expectedBlockedRows =
    unsupportedScenarioIds.length *
    REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length;

  if (
    rootRenderGateResult.summary
      .privateCrossRootSchedulingDiagnosticScenarioModeRowCount !==
      expectedAdmittedRows ||
    rootRenderGateResult.summary
      .privateCrossRootSchedulingBlockedScenarioModeRowCount !==
      expectedBlockedRows
  ) {
    failures.push({
      gateStatus: "root-render-private-cross-root-scheduling-row-count-mismatch",
      actualAdmitted:
        rootRenderGateResult.summary
          .privateCrossRootSchedulingDiagnosticScenarioModeRowCount ?? null,
      actualBlocked:
        rootRenderGateResult.summary
          .privateCrossRootSchedulingBlockedScenarioModeRowCount ?? null,
      expectedAdmitted: expectedAdmittedRows,
      expectedBlocked: expectedBlockedRows
    });
  }

  if (
    rootRenderGateResult.summary
      .privateCrossRootSchedulingCompatibilityClaimed !== false ||
    rootRenderGateResult.summary
      .privateCrossRootSchedulingPublicFlushSyncCompatibilityClaimed !==
      false ||
    rootRenderGateResult.privateCrossRootSchedulingGate
      ?.compatibilityClaimed !== false ||
    rootRenderGateResult.privateCrossRootSchedulingGate
      ?.publicFlushSyncCompatibilityClaimed !== false
  ) {
    failures.push({
      gateStatus:
        "root-render-private-cross-root-scheduling-claims-compatibility-while-public-facade-blocked",
      summaryClaim:
        rootRenderGateResult.summary
          .privateCrossRootSchedulingCompatibilityClaimed ?? null,
      summaryPublicFlushSyncClaim:
        rootRenderGateResult.summary
          .privateCrossRootSchedulingPublicFlushSyncCompatibilityClaimed ??
        null,
      gateClaim:
        rootRenderGateResult.privateCrossRootSchedulingGate
          ?.compatibilityClaimed ?? null,
      gatePublicFlushSyncClaim:
        rootRenderGateResult.privateCrossRootSchedulingGate
          ?.publicFlushSyncCompatibilityClaimed ?? null
    });
  }

  if (
    findFirstDifferencePath(
      rootRenderGateResult.privateCrossRootSchedulingGate
        ?.admittedPrivateCrossRootSchedulingScenarioIds ?? [],
      admittedScenarioIds
    ) !== null ||
    findFirstDifferencePath(
      rootRenderGateResult.privateCrossRootSchedulingGate
        ?.unsupportedPrivateCrossRootSchedulingScenarioIds ?? [],
      unsupportedScenarioIds
    ) !== null
  ) {
    failures.push({
      gateStatus:
        "root-render-private-cross-root-scheduling-admission-set-mismatch",
      admitted:
        rootRenderGateResult.privateCrossRootSchedulingGate
          ?.admittedPrivateCrossRootSchedulingScenarioIds ?? null,
      unsupported:
        rootRenderGateResult.privateCrossRootSchedulingGate
          ?.unsupportedPrivateCrossRootSchedulingScenarioIds ?? null
    });
  }

  for (const row of rootRenderGateResult.privateCrossRootSchedulingDiagnosticScenarioModeRows ??
    []) {
    if (
      row.gateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ACCEPTED_STATUS ||
      row.scenarioId !== "flush-sync-cross-root-render" ||
      row.publicFacadeGateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_BLOCKED_STATUS ||
      row.publicRootCompatibilitySurface !== false ||
      row.comparedToReactDomOracle !== false ||
      row.compatibilityClaimed !== false ||
      row.publicFlushSyncCompatibilityClaimed !== false ||
      row.diagnosticKind !== "private-cross-root-scheduling-flush"
    ) {
      failures.push({
        modeId: row.modeId,
        scenarioId: row.scenarioId,
        gateStatus: "root-render-private-cross-root-scheduling-row-not-private",
        row
      });
    }
  }

  for (const row of rootRenderGateResult.privateCrossRootSchedulingBlockedScenarioModeRows ??
    []) {
    if (
      row.gateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_BLOCKED_STATUS ||
      row.publicFacadeGateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_BLOCKED_STATUS ||
      row.publicRootCompatibilitySurface !== false ||
      row.comparedToReactDomOracle !== false ||
      row.compatibilityClaimed !== false ||
      row.publicFlushSyncCompatibilityClaimed !== false
    ) {
      failures.push({
        modeId: row.modeId,
        scenarioId: row.scenarioId,
        gateStatus:
          "root-render-private-cross-root-scheduling-blocked-row-not-fail-closed",
        row
      });
    }
  }
}

function validateRootRenderPrivateActPassiveBlockers({
  rootRenderGateResult,
  failures
}) {
  if (!rootRenderGateResult) {
    return;
  }

  const admittedScenarioIds =
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ADMISSIONS.filter(
      (admission) =>
        admission.admission === "private-act-passive-diagnostic"
    ).map((admission) => admission.scenarioId);
  const unsupportedScenarioIds =
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ADMISSIONS.filter(
      (admission) => admission.admission === "unsupported"
    ).map((admission) => admission.scenarioId);
  const expectedAdmittedRows =
    admittedScenarioIds.length * REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length;
  const expectedBlockedRows =
    unsupportedScenarioIds.length * REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length;

  if (
    rootRenderGateResult.summary
      .privateActPassiveDiagnosticScenarioModeRowCount !==
      expectedAdmittedRows ||
    rootRenderGateResult.summary.privateActPassiveBlockedScenarioModeRowCount !==
      expectedBlockedRows
  ) {
    failures.push({
      gateStatus: "root-render-private-act-passive-row-count-mismatch",
      actualAdmitted:
        rootRenderGateResult.summary
          .privateActPassiveDiagnosticScenarioModeRowCount ?? null,
      actualBlocked:
        rootRenderGateResult.summary
          .privateActPassiveBlockedScenarioModeRowCount ?? null,
      expectedAdmitted: expectedAdmittedRows,
      expectedBlocked: expectedBlockedRows
    });
  }

  if (
    rootRenderGateResult.summary.privateActPassiveCompatibilityClaimed !==
      false ||
    rootRenderGateResult.summary
      .privateActPassivePublicReactActCompatibilityClaimed !== false ||
    rootRenderGateResult.summary
      .privateActPassivePublicReactDomTestUtilsActCompatibilityClaimed !==
      false ||
    rootRenderGateResult.summary
      .privateActPassivePublicRootRenderCompatibilityClaimed !== false ||
    rootRenderGateResult.summary
      .privateActPassivePublicPassiveEffectCompatibilityClaimed !== false ||
    rootRenderGateResult.privateActPassiveGate?.compatibilityClaimed !== false ||
    rootRenderGateResult.privateActPassiveGate
      ?.publicReactActCompatibilityClaimed !== false ||
    rootRenderGateResult.privateActPassiveGate
      ?.publicReactDomTestUtilsActCompatibilityClaimed !== false ||
    rootRenderGateResult.privateActPassiveGate
      ?.publicRootRenderCompatibilityClaimed !== false ||
    rootRenderGateResult.privateActPassiveGate
      ?.publicPassiveEffectCompatibilityClaimed !== false
  ) {
    failures.push({
      gateStatus:
        "root-render-private-act-passive-claims-compatibility-while-public-facade-blocked",
      summaryClaim:
        rootRenderGateResult.summary.privateActPassiveCompatibilityClaimed ??
        null,
      summaryPublicReactActClaim:
        rootRenderGateResult.summary
          .privateActPassivePublicReactActCompatibilityClaimed ?? null,
      summaryPublicTestUtilsActClaim:
        rootRenderGateResult.summary
          .privateActPassivePublicReactDomTestUtilsActCompatibilityClaimed ??
        null,
      summaryPublicRootClaim:
        rootRenderGateResult.summary
          .privateActPassivePublicRootRenderCompatibilityClaimed ?? null,
      summaryPublicPassiveClaim:
        rootRenderGateResult.summary
          .privateActPassivePublicPassiveEffectCompatibilityClaimed ?? null
    });
  }

  if (
    findFirstDifferencePath(
      rootRenderGateResult.privateActPassiveGate
        ?.admittedPrivateActPassiveScenarioIds ?? [],
      admittedScenarioIds
    ) !== null ||
    findFirstDifferencePath(
      rootRenderGateResult.privateActPassiveGate
        ?.unsupportedPrivateActPassiveScenarioIds ?? [],
      unsupportedScenarioIds
    ) !== null
  ) {
    failures.push({
      gateStatus: "root-render-private-act-passive-admission-set-mismatch",
      admitted:
        rootRenderGateResult.privateActPassiveGate
          ?.admittedPrivateActPassiveScenarioIds ?? null,
      unsupported:
        rootRenderGateResult.privateActPassiveGate
          ?.unsupportedPrivateActPassiveScenarioIds ?? null
    });
  }

  for (const row of rootRenderGateResult.privateActPassiveDiagnosticScenarioModeRows ??
    []) {
    if (
      row.gateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ACCEPTED_STATUS ||
      row.publicFacadeGateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_BLOCKED_STATUS ||
      row.publicRootCompatibilitySurface !== false ||
      row.comparedToReactDomOracle !== false ||
      row.compatibilityClaimed !== false ||
      row.publicReactActCompatibilityClaimed !== false ||
      row.publicReactDomTestUtilsActCompatibilityClaimed !== false ||
      row.publicRootRenderCompatibilityClaimed !== false ||
      row.publicPassiveEffectCompatibilityClaimed !== false ||
      row.diagnosticKind !== "private-root-render-act-passive-diagnostic"
    ) {
      failures.push({
        modeId: row.modeId,
        scenarioId: row.scenarioId,
        gateStatus: "root-render-private-act-passive-row-not-private",
        row
      });
    }
  }

  for (const row of rootRenderGateResult.privateActPassiveBlockedScenarioModeRows ??
    []) {
    if (
      row.gateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_BLOCKED_STATUS ||
      row.publicFacadeGateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_BLOCKED_STATUS ||
      row.publicRootCompatibilitySurface !== false ||
      row.comparedToReactDomOracle !== false ||
      row.compatibilityClaimed !== false ||
      row.publicReactActCompatibilityClaimed !== false ||
      row.publicReactDomTestUtilsActCompatibilityClaimed !== false ||
      row.publicRootRenderCompatibilityClaimed !== false ||
      row.publicPassiveEffectCompatibilityClaimed !== false
    ) {
      failures.push({
        modeId: row.modeId,
        scenarioId: row.scenarioId,
        gateStatus:
          "root-render-private-act-passive-blocked-row-not-fail-closed",
        row
      });
    }
  }
}

function validateRootRenderPortalBlockers({ rootRenderGateResult, failures }) {
  if (!rootRenderGateResult) {
    return;
  }

  if (
    rootRenderGateResult.summary.portalRootRenderCompatibilityClaimed !==
      false ||
    rootRenderGateResult.portalRootRenderGate?.summary?.compatibilityClaimed !==
      false ||
    rootRenderGateResult.summary.privatePortalMetadataPromotesPublicRootRender !==
      false ||
    rootRenderGateResult.portalRootRenderGate?.summary
      ?.privatePortalMetadataPromotesPublicRootRender !== false
  ) {
    failures.push({
      gateStatus:
        "root-render-portal-claims-compatibility-while-public-facade-blocked",
      summaryClaim:
        rootRenderGateResult.summary.portalRootRenderCompatibilityClaimed ??
        null,
      gateClaim:
        rootRenderGateResult.portalRootRenderGate?.summary
          ?.compatibilityClaimed ?? null,
      privatePortalMetadataPromotion:
        rootRenderGateResult.summary
          .privatePortalMetadataPromotesPublicRootRender ?? null,
      gatePrivatePortalMetadataPromotion:
        rootRenderGateResult.portalRootRenderGate?.summary
          ?.privatePortalMetadataPromotesPublicRootRender ?? null
    });
  }

  if (
    rootRenderGateResult.summary.portalRootRenderBlockedRowCount !==
    REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_BOUNDARY_ROWS.length
  ) {
    failures.push({
      gateStatus: "root-render-portal-blocked-row-count-mismatch",
      actual: rootRenderGateResult.summary.portalRootRenderBlockedRowCount ?? null,
      expected: REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_BOUNDARY_ROWS.length
    });
  }

  for (const row of rootRenderGateResult.portalRootRenderPrerequisiteRows ?? []) {
    if (row.compatibilityClaimed !== false) {
      failures.push({
        gateStatus: "root-render-portal-prerequisite-claims-compatibility",
        row
      });
    }
  }

  for (const row of rootRenderGateResult.portalRootRenderBlockedRows ?? []) {
    if (
      row.gateStatus !== REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_STATUS ||
      row.publicRootCompatibilitySurface !== false ||
      row.privatePortalMetadataPromotesPublicRootRender !== false ||
      row.compatibilityClaimed !== false
    ) {
      failures.push({
        gateStatus: "root-render-portal-blocked-row-not-fail-closed",
        row
      });
    }
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
      admission.gateStatus !== REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS ||
      admission.comparedToAcceptedReactDomOracle !== true ||
      admission.publicCompatibilityClaimed !== false
    ) {
      failures.push({
        scenarioId,
        gateStatus: "public-facade-scenario-admission-not-blocked",
        admission: admission.admission,
        admissionGateStatus: admission.gateStatus ?? null,
        comparedToAcceptedReactDomOracle:
          admission.comparedToAcceptedReactDomOracle ?? null,
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

  if (
    localPublicFacadeBoundary.hydrateRoot.rootObjectCreated === false &&
    isRootFacadeSideEffectFree(localPublicFacadeBoundary.hydrateRoot.sideEffects)
  ) {
    blockedPublicFacadeRows.push({
      id: "public-hydration",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      reason:
        "Public hydrateRoot throws before hydration root creation, marker consumption, event replay, or DOM matching can run.",
      compatibilityClaimed: false,
      privateBridgeEvidence: "separate"
    });
  } else {
    failures.push({
      gateStatus: "public-hydration-not-placeholder-blocked",
      hydrateRoot: localPublicFacadeBoundary.hydrateRoot
    });
  }

  if (localPublicFacadeBoundary.createRoot.rootObjectCreated === false) {
    blockedPublicFacadeRows.push({
      id: "public-root-render",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      reason: "root.render is unreachable because public createRoot is blocked.",
      compatibilityClaimed: false
    });
    blockedPublicFacadeRows.push({
      id: "public-root-unmount",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      reason: "root.unmount is unreachable because public createRoot is blocked.",
      compatibilityClaimed: false
    });
  } else {
    failures.push({
      gateStatus: "public-root-object-created-while-facade-blocked",
      createRoot: localPublicFacadeBoundary.createRoot
    });
  }

  validatePublicRootLifecycleBlocked({
    publicRootLifecycle: localPublicFacadeBoundary.publicRootLifecycle,
    blockedPublicFacadeRows,
    failures
  });

  blockedPublicFacadeRows.push({
    id: "public-portal-root-render",
    gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
    reason:
      "createPortal object construction remains separate from mounting a portal through blocked public root.render.",
    compatibilityClaimed: false,
    privateHostOutputEvidence: "separate",
    privatePortalMetadataPromotesPublicRootRender: false,
    portalRootRenderEvidence: "separate"
  });

  blockedPublicFacadeRows.push({
    id: "public-development-warning-compatibility",
    gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
    reason:
      "Private warning-boundary metadata remains separate from public console warning compatibility while public roots are placeholders.",
    compatibilityClaimed: false,
    privateWarningBoundaryEvidence: "separate"
  });

  blockedPublicFacadeRows.push({
    id: "public-flush-sync-cross-root-compatibility",
    gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
    reason:
      "Private cross-root scheduling diagnostics remain separate from public ReactDOM.flushSync compatibility while public roots are placeholders.",
    compatibilityClaimed: false,
    privateCrossRootSchedulingEvidence: "separate"
  });

  blockedPublicFacadeRows.push({
    id: "public-act-passive-root-render-compatibility",
    gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
    reason:
      "Private act/passive diagnostics remain separate from public React act, React DOM test-utils act, passive effect, and public root compatibility while public roots are placeholders.",
    compatibilityClaimed: false,
    privateActPassiveEvidence: "separate"
  });

  const createRootSideEffects = localPublicFacadeBoundary.createRoot.sideEffects;
  const hydrateRootSideEffects = localPublicFacadeBoundary.hydrateRoot.sideEffects;
  if (
    isRootFacadeSideEffectFree(createRootSideEffects) &&
    isRootFacadeSideEffectFree(hydrateRootSideEffects)
  ) {
    blockedPublicFacadeRows.push({
      id: "public-dom-mutation",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      mutationCount:
        createRootSideEffects.mutationCount +
        hydrateRootSideEffects.mutationCount
    });
    blockedPublicFacadeRows.push({
      id: "public-listener-setup",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
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
      compatibilityClaimed: false,
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

function validatePublicRootLifecycleBlocked({
  publicRootLifecycle,
  blockedPublicFacadeRows,
  failures
}) {
  if (!publicRootLifecycle || typeof publicRootLifecycle !== "object") {
    failures.push({
      gateStatus: "missing-public-root-lifecycle-boundary"
    });
    return;
  }

  const lifecycleRows = [
    {
      key: "renderInitial",
      expected: REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS[0],
      expectedLabel: "react-dom/client.createRoot(...).render(initial)"
    },
    {
      key: "renderUpdate",
      expected: REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS[1],
      expectedLabel: "react-dom/client.createRoot(...).render(update)"
    },
    {
      key: "unmount",
      expected: REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS[2],
      expectedLabel: "react-dom/client.createRoot(...).unmount()"
    }
  ];

  for (const { expected, expectedLabel, key } of lifecycleRows) {
    const operation = publicRootLifecycle[key];
    if (!operation) {
      failures.push({
        gateStatus: "missing-public-root-lifecycle-operation",
        id: expected.id
      });
      continue;
    }

    if (
      !operation.sideEffects ||
      !isRootFacadeSideEffectFree(operation.sideEffects)
    ) {
      failures.push({
        gateStatus: "public-root-lifecycle-operation-produced-side-effects",
        id: expected.id,
        sideEffects: operation.sideEffects
      });
      continue;
    }

    if (operation.compatibilityClaimed !== false) {
      failures.push({
        gateStatus: "public-root-lifecycle-operation-claims-compatibility",
        id: expected.id,
        compatibilityClaimed: operation.compatibilityClaimed ?? null
      });
      continue;
    }

    if (
      operation.label === expectedLabel &&
      operation.status === "throws" &&
      operation.thrown.code === "FAST_REACT_UNIMPLEMENTED" &&
      operation.thrown.entrypoint === "react-dom/client" &&
      operation.thrown.exportName === "createRoot" &&
      operation.blockedAt === "createRoot" &&
      operation.createRootAttempt?.status === "throws" &&
      operation.createRootAttempt.thrown.code === "FAST_REACT_UNIMPLEMENTED" &&
      operation.lifecycleOperationAttempted === false &&
      operation.rootObjectCreated === false
    ) {
      blockedPublicFacadeRows.push({
        id: expected.id,
        gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
        blockedAt: "createRoot",
        compatibilityClaimed: false,
        listenerRegistrationCount: getRootFacadeListenerRegistrationCount(
          operation.sideEffects
        ),
        mutationCount: getRootFacadeMutationCount(operation.sideEffects),
        privateBridgeEvidence: "separate",
        publicApi: expected.publicApi,
        scenarioId: expected.scenarioId
      });
      continue;
    }

    failures.push({
      gateStatus: "public-root-lifecycle-operation-not-placeholder-blocked",
      id: expected.id,
      operation
    });
  }
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
  validatePrivateRootBridgeAdmissions({
    admissions: privateRootBridgeBoundary.admissions,
    failures
  });
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
    "private-double-unmount-noop-record",
    "private-create-root-admission",
    "private-root-render-admission",
    "private-root-unmount-admission",
    "private-double-unmount-noop-admission"
  ]) {
    blockedPrivateBridgeRows.push({
      id,
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BRIDGE_RECORD_ONLY_STATUS,
      compatibilityClaimed: false
    });
  }
}

function validatePrivateRootBridgeAdmissions({ admissions, failures }) {
  if (!admissions || typeof admissions !== "object") {
    failures.push({
      gateStatus: "private-root-bridge-admission-metadata-missing"
    });
    return;
  }

  const expectedAdmissions = [
    {
      key: "create",
      operation: "create",
      requestType: "createRoot",
      lifecycleTransition: "none->created"
    },
    {
      key: "render",
      operation: "render",
      requestType: "root.render",
      lifecycleTransition: "created->rendered"
    },
    {
      key: "unmount",
      operation: "unmount",
      requestType: "root.unmount",
      lifecycleTransition: "rendered->unmounted"
    },
    {
      key: "secondUnmount",
      operation: "unmount",
      requestType: "root.unmount",
      lifecycleTransition: "unmounted->unmounted"
    }
  ];

  for (const expected of expectedAdmissions) {
    const admission = admissions[expected.key];
    if (!admission) {
      failures.push({
        gateStatus: "private-root-bridge-admission-row-missing",
        key: expected.key
      });
      continue;
    }

    const blockedCapabilityIds = admission.blockedCapabilities?.map(
      (capability) => capability.id
    );
    const allCapabilitiesBlocked = admission.blockedCapabilities?.every(
      (capability) => capability.blocked === true
    );

    if (
      admission.kind === "FastReactDomPrivateRootAdmissionRecord" &&
      admission.operation === expected.operation &&
      admission.requestType === expected.requestType &&
      admission.admissionStatus ===
        "admitted-private-root-bridge-request-record" &&
      admission.executionStatus === "blocked-private-root-bridge-execution" &&
      admission.compatibilityStatus ===
        "blocked-private-root-bridge-compatibility" &&
      admission.lifecyclePrerequisites?.accepted === true &&
      admission.lifecyclePrerequisites?.lifecycleTransition ===
        expected.lifecycleTransition &&
      admission.nativeExecution === false &&
      admission.reconcilerExecution === false &&
      admission.domMutation === false &&
      admission.markerWrites === false &&
      admission.listenerInstallation === false &&
      admission.hydration === false &&
      admission.eventDispatch === false &&
      admission.compatibilityClaimed === false &&
      allCapabilitiesBlocked === true &&
      findFirstDifferencePath(blockedCapabilityIds, [
        "native-execution",
        "reconciler-execution",
        "dom-mutation",
        "marker-writes",
        "listener-installation",
        "hydration",
        "events",
        "compatibility-claims"
      ]) === null
    ) {
      continue;
    }

    failures.push({
      gateStatus: "private-root-bridge-admission-row-not-record-only",
      key: expected.key,
      admission
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

  if (
    !isAcceptedPrivateRootPortalBoundary(
      portalRootRenderObservations.privateRootBridgePortalBoundary
    )
  ) {
    failures.push({
      gateStatus: "portal-private-root-boundary-record-mismatch",
      boundary: portalRootRenderObservations.privateRootBridgePortalBoundary
    });
  }

  if (
    !isAcceptedPrivateRootPortalBoundaryPayload(
      portalRootRenderObservations.privateRootBridgePortalBoundaryPayload
    )
  ) {
    failures.push({
      gateStatus: "portal-private-root-boundary-payload-mismatch",
      payload: portalRootRenderObservations.privateRootBridgePortalBoundaryPayload
    });
  }

  if (
    !isAcceptedPrivateRootPortalRequest(
      portalRootRenderObservations.privateRootBridgePortalRequest
    )
  ) {
    failures.push({
      gateStatus: "portal-private-root-boundary-request-mismatch",
      request: portalRootRenderObservations.privateRootBridgePortalRequest
    });
  }

  const invalidPortalBoundary =
    portalRootRenderObservations.invalidPortalRootBoundary;
  if (
    invalidPortalBoundary.status !== "throws" ||
    invalidPortalBoundary.thrown.code !==
      "FAST_REACT_DOM_INVALID_PORTAL_ROOT_BOUNDARY_RECORD"
  ) {
    failures.push({
      gateStatus: "portal-private-root-boundary-not-fail-closed",
      invalidPortalBoundary
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

function validatePortalPrivateRootBridgeDiagnostics({
  portalRootRenderObservations,
  failures
}) {
  if (portalRootRenderObservations.loadError) {
    return;
  }

  if (
    !isAcceptedPrivateRootBridgePortalDiagnostics(
      portalRootRenderObservations.privateRootBridgePortalDiagnostics
    )
  ) {
    failures.push({
      gateStatus:
        "portal-private-root-diagnostics-promoted-public-root-render",
      diagnostics:
        portalRootRenderObservations.privateRootBridgePortalDiagnostics
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
      privatePortalDiagnosticsAccepted:
        isAcceptedPrivateRootBridgePortalDiagnostics(
          portalRootRenderObservations.privateRootBridgePortalDiagnostics
        ),
      privatePortalMetadataPromotesPublicRootRender: false,
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

function inspectReactDomRootPublicFacadeLifecycle({
  domContainer,
  listenerRegistry,
  reactDomClient,
  rootMarkers
}) {
  return {
    renderInitial: attemptChainedPublicRootOperation({
      domContainer,
      label: "react-dom/client.createRoot(...).render(initial)",
      listenerRegistry,
      reactDomClient,
      rootMarkers,
      runLifecycleOperation(root) {
        return root.render({
          props: {
            children: "initial public child"
          },
          type: "span"
        });
      }
    }),
    renderUpdate: attemptChainedPublicRootOperation({
      domContainer,
      label: "react-dom/client.createRoot(...).render(update)",
      listenerRegistry,
      reactDomClient,
      rootMarkers,
      runLifecycleOperation(root) {
        root.render({
          props: {
            children: "initial public child"
          },
          type: "span"
        });
        return root.render({
          props: {
            children: "updated public child"
          },
          type: "span"
        });
      }
    }),
    unmount: attemptChainedPublicRootOperation({
      domContainer,
      label: "react-dom/client.createRoot(...).unmount()",
      listenerRegistry,
      reactDomClient,
      rootMarkers,
      runLifecycleOperation(root) {
        return root.unmount();
      }
    })
  };
}

function attemptChainedPublicRootOperation({
  domContainer,
  label,
  listenerRegistry,
  reactDomClient,
  rootMarkers,
  runLifecycleOperation
}) {
  const ownerDocument = createGateDocument(label, domContainer);
  const container = createGateElement("DIV", ownerDocument, domContainer);
  let createRootAttempt = null;
  let lifecycleOperationAttempted = false;
  let rootObjectCreated = false;

  const result = attemptGateOperation(label, () => {
    let root;
    try {
      root = reactDomClient.createRoot(container);
      createRootAttempt = {
        status: "ok",
        value: describeLocalValue(root)
      };
      rootObjectCreated = root !== null && typeof root === "object";
    } catch (error) {
      createRootAttempt = {
        status: "throws",
        thrown: serializeGateError(error)
      };
      throw error;
    }

    lifecycleOperationAttempted = true;
    return runLifecycleOperation(root);
  });

  return {
    ...result,
    blockedAt: createRootAttempt?.status === "throws" ? "createRoot" : null,
    compatibilityClaimed: false,
    createRootAttempt,
    lifecycleOperationAttempted,
    rootObjectCreated,
    sideEffects: inspectRootFacadeSideEffects(
      container,
      ownerDocument,
      rootMarkers,
      listenerRegistry
    )
  };
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

function loadPrivateHostOutputModules(workspaceRoot) {
  const reactDomRoot = join(workspaceRoot, "packages/react-dom");
  return {
    ...loadPrivateBridgeModules(workspaceRoot),
    componentTree: require(join(reactDomRoot, "src/client/component-tree.js")),
    domHost: require(join(reactDomRoot, "src/dom-host/mutation.js")),
    flushSyncGuard: require(join(reactDomRoot, "src/shared/flush-sync-guard.js")),
    syncFlushCrossRootReconcilerDiagnostics:
      inspectSyncFlushCrossRootReconcilerDiagnostics({ workspaceRoot })
  };
}

function loadPrivateCrossRootSchedulingModules(workspaceRoot) {
  const reactDomRoot = join(workspaceRoot, "packages/react-dom");
  return {
    ...loadPrivateBridgeModules(workspaceRoot),
    flushSyncGuard: require(join(reactDomRoot, "src/shared/flush-sync-guard.js")),
    syncFlushCrossRootReconcilerDiagnostics:
      inspectSyncFlushCrossRootReconcilerDiagnostics({ workspaceRoot })
  };
}

function loadPrivateActPassiveModules(workspaceRoot) {
  return {
    reactActGate: require(
      join(workspaceRoot, "packages/react/private-act-dispatcher-gate.js")
    ),
    reactDomTestUtilsActGate: require(
      join(workspaceRoot, "packages/react-dom/src/test-utils-act-gate.js")
    ),
    sourceDiagnostics: inspectActPassiveSourceDiagnostics({ workspaceRoot })
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

function runPrivateHostOutputDiagnosticScenario({ mode, modules, scenarioId }) {
  try {
    const harness = createPrivateHostOutputHarness({
      mode,
      modules,
      scenarioId
    });
    const sideEffects = applyPrivateHostOutputRootSideEffects(harness);
    let hostOutputEvidence;

    if (scenarioId === "create-root-no-render") {
      hostOutputEvidence = {
        childNodeNames: summarizeChildNodeNames(harness.container),
        containerChildCount: harness.container.childNodes.length,
        containerTextContent: harness.container.textContent,
        hostMutationObserved: false,
        latestPropsPublished: false
      };
    } else if (scenarioId === "initial-host-render") {
      const render = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("initial")
      );
      recordPrivateHostOutputRootRequest(harness, render);
      hostOutputEvidence = mountPrivateInitialHostOutput(harness);
    } else if (scenarioId === "update-host-render") {
      const initialRender = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("initial")
      );
      recordPrivateHostOutputRootRequest(harness, initialRender);
      const mounted = mountPrivateInitialHostOutput(harness);
      const updateRender = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("updated")
      );
      recordPrivateHostOutputRootRequest(harness, updateRender);
      hostOutputEvidence = updatePrivateHostOutput(harness, mounted);
    } else if (scenarioId === "replace-host-tree") {
      const initialRender = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("replace-before")
      );
      recordPrivateHostOutputRootRequest(harness, initialRender);
      const mounted = mountPrivateReplacementInitialHostOutput(harness);
      const replaceRender = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("replace-after")
      );
      recordPrivateHostOutputRootRequest(harness, replaceRender);
      hostOutputEvidence = replacePrivateHostOutput(harness, mounted);
    } else if (scenarioId === "render-null-clears-container") {
      const render = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("initial")
      );
      recordPrivateHostOutputRootRequest(harness, render);
      const mounted = mountPrivateInitialHostOutput(harness);
      const renderNull = harness.bridge.renderContainer(
        harness.create.handle,
        null
      );
      recordPrivateHostOutputRootRequest(harness, renderNull);
      hostOutputEvidence = renderNullPrivateHostOutput(harness, mounted);
    } else if (scenarioId === "root-unmount") {
      const render = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("initial")
      );
      recordPrivateHostOutputRootRequest(harness, render);
      const mounted = mountPrivateInitialHostOutput(harness);
      const unmount = harness.bridge.unmountContainer(harness.create.handle);
      recordPrivateHostOutputRootRequest(harness, unmount);
      hostOutputEvidence = unmountPrivateHostOutput(harness, mounted);
    } else if (scenarioId === "double-unmount") {
      const render = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("initial")
      );
      recordPrivateHostOutputRootRequest(harness, render);
      const mounted = mountPrivateInitialHostOutput(harness);
      const firstUnmount = harness.bridge.unmountContainer(
        harness.create.handle
      );
      recordPrivateHostOutputRootRequest(harness, firstUnmount);
      hostOutputEvidence = unmountPrivateHostOutput(harness, mounted);
      const secondUnmount = harness.bridge.unmountContainer(
        harness.create.handle
      );
      recordPrivateHostOutputRootRequest(harness, secondUnmount);
      hostOutputEvidence = recordPrivateDoubleUnmountNoop(
        harness,
        hostOutputEvidence
      );
    } else if (scenarioId === "render-after-unmount") {
      const render = harness.bridge.renderContainer(
        harness.create.handle,
        createPrivateHostOutputElementValue("initial")
      );
      recordPrivateHostOutputRootRequest(harness, render);
      const mounted = mountPrivateInitialHostOutput(harness);
      const unmount = harness.bridge.unmountContainer(harness.create.handle);
      recordPrivateHostOutputRootRequest(harness, unmount);
      hostOutputEvidence = unmountPrivateHostOutput(harness, mounted);
      hostOutputEvidence = recordPrivateRenderAfterUnmountGuard(
        harness,
        hostOutputEvidence
      );
    } else if (scenarioId === "flush-sync-cross-root-render") {
      hostOutputEvidence = flushSyncCrossRootPrivateHostOutput(harness);
    } else {
      throw new Error(
        `No private host-output diagnostic plan for scenario: ${scenarioId}`
      );
    }

    const cleanup = cleanupPrivateHostOutputRootSideEffects(
      harness,
      sideEffects.rawRecord
    );
    const { rawRecord, ...sideEffectEvidence } = sideEffects;

    return {
      modeId: mode.id,
      scenarioId,
      status: "ok",
      evidence: {
        compatibilityClaimed: false,
        comparedToReactDomOracle: false,
        diagnosticKind: "private-fake-dom-root-host-output",
        hostOutputEvidence,
        publicRootCompatibilitySurface: false,
        rootBridgeEvidence: summarizePrivateHostOutputRootBridgeEvidence(
          harness
        ),
        rootSideEffectEvidence: {
          ...sideEffectEvidence,
          cleanup
        }
      }
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

function runPrivateCrossRootSchedulingDiagnosticScenario({
  mode,
  modules,
  scenarioId
}) {
  try {
    if (scenarioId !== "flush-sync-cross-root-render") {
      throw new Error(
        `No private cross-root scheduling diagnostic plan for scenario: ${scenarioId}`
      );
    }

    const harness = createPrivateCrossRootSchedulingHarness({
      mode,
      modules,
      scenarioId
    });
    const firstRoot = {
      container: harness.container,
      create: harness.create,
      document: harness.document
    };
    const firstSideEffects =
      applyPrivateHostOutputRootSideEffectsForRoot(harness, firstRoot);
    const {
      rawRecord: firstRawSideEffectRecord,
      ...firstSideEffectEvidence
    } = firstSideEffects;
    const secondRoot = createAdditionalPrivateHostOutputRoot(
      harness,
      "cross-root-b"
    );
    recordPrivateHostOutputRootRequest(harness, secondRoot.create);
    const secondSideEffects =
      applyPrivateHostOutputRootSideEffectsForRoot(harness, secondRoot);
    const {
      rawRecord: secondRawSideEffectRecord,
      ...secondSideEffectEvidence
    } = secondSideEffects;

    const callbackEvents = [];
    const firstRender = harness.bridge.renderContainer(
      firstRoot.create.handle,
      createPrivateHostOutputElementValue("cross-a")
    );
    recordPrivateHostOutputRootRequest(harness, firstRender);
    callbackEvents.push("root.render:first");
    const secondRender = harness.bridge.renderContainer(
      secondRoot.create.handle,
      createPrivateHostOutputElementValue("cross-b")
    );
    recordPrivateHostOutputRootRequest(harness, secondRender);
    callbackEvents.push("root.render:second");

    const flushSyncWarnings = [];
    const flushSyncWorkWasInRender =
      harness.modules.flushSyncGuard.finishFlushSyncGuard(
        {
          f() {
            callbackEvents.push("flushSyncWork");
            return false;
          }
        },
        {
          console: {
            error(message) {
              flushSyncWarnings.push(message);
            }
          },
          development: harness.mode.nodeEnv !== "production"
        }
      );
    const rootSideEffectStateAfterFlush = {
      first: summarizePrivateRootMarkerListenerState({
        container: firstRoot.container,
        document: firstRoot.document,
        modules: harness.modules
      }),
      second: summarizePrivateRootMarkerListenerState({
        container: secondRoot.container,
        document: secondRoot.document,
        modules: harness.modules
      })
    };

    const secondCleanup = cleanupPrivateHostOutputRootSideEffectsForRoot(
      harness,
      secondRoot,
      secondRawSideEffectRecord
    );
    const firstCleanup = cleanupPrivateHostOutputRootSideEffectsForRoot(
      harness,
      firstRoot,
      firstRawSideEffectRecord
    );

    return {
      modeId: mode.id,
      scenarioId,
      status: "ok",
      evidence: {
        compatibilityClaimed: false,
        comparedToReactDomOracle: false,
        diagnosticKind: "private-cross-root-scheduling-flush",
        publicFlushSyncCompatibilityClaimed: false,
        publicRootCompatibilitySurface: false,
        rootBridgeEvidence: summarizePrivateHostOutputRootBridgeEvidence(
          harness
        ),
        rootSideEffectEvidence: {
          first: {
            ...firstSideEffectEvidence,
            cleanup: firstCleanup
          },
          second: {
            ...secondSideEffectEvidence,
            cleanup: secondCleanup
          }
        },
        schedulingEvidence: {
          callbackEvents,
          callbackRenderRequestCount: 2,
          callbackReturnValue: "two-root-flush-complete",
          committedRootCountAfterFlush: 2,
          flushSyncGuardWarningCount: flushSyncWarnings.length,
          flushSyncWorkCallCount: callbackEvents.filter(
            (event) => event === "flushSyncWork"
          ).length,
          flushSyncWorkWasInRender,
          privateReconcilerDiagnostics:
            harness.modules.syncFlushCrossRootReconcilerDiagnostics,
          publicFlushSyncCompatibilityClaimed: false,
          rootSideEffectStateAfterFlush,
          scheduledRootCount: 2
        }
      }
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

function runPrivateActPassiveDiagnosticScenario({ mode, modules, scenarioId }) {
  try {
    const testUtilsActGate =
      modules.reactDomTestUtilsActGate.evaluateReactDomTestUtilsActPrivateRoutingGate();
    const rendererBackedDiagnostics =
      modules.reactActGate.createRendererBackedActDrainDiagnostics();
    const rendererBackedConsumption =
      modules.reactActGate.consumeRendererBackedActDrainDiagnostics(
        rendererBackedDiagnostics
      );
    const actQueueMetadata = modules.reactActGate.createActQueueMetadata();

    return {
      modeId: mode.id,
      scenarioId,
      status: "ok",
      evidence: {
        compatibilityClaimed: false,
        comparedToReactDomOracle: false,
        diagnosticKind: "private-root-render-act-passive-diagnostic",
        publicPassiveEffectCompatibilityClaimed: false,
        publicReactActCompatibilityClaimed: false,
        publicReactDomTestUtilsActCompatibilityClaimed: false,
        publicRootCompatibilitySurface: false,
        publicRootRenderCompatibilityClaimed: false,
        actEvidence: summarizePrivateActEvidence({
          actQueueMetadata,
          rendererBackedConsumption,
          rendererBackedDiagnostics,
          testUtilsActGate
        }),
        passiveEvidence: summarizePrivatePassiveEvidence(testUtilsActGate),
        blockedPublicPrerequisites:
          testUtilsActGate.publicPrerequisitesStillBlocked,
        sourceDiagnostics: modules.sourceDiagnostics
      }
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

function summarizePrivateActEvidence({
  actQueueMetadata,
  rendererBackedConsumption,
  rendererBackedDiagnostics,
  testUtilsActGate
}) {
  return {
    reactActPrivateDispatcher: {
      status: testUtilsActGate.reactActPrivateDispatcher.status,
      publicCompatibilityClaimed:
        testUtilsActGate.reactActPrivateDispatcher.publicCompatibilityClaimed,
      queueFlushingReady:
        testUtilsActGate.reactActPrivateDispatcher.queueFlushingReady,
      rendererRootsReady:
        testUtilsActGate.reactActPrivateDispatcher.rendererRootsReady,
      passiveEffectsReady:
        testUtilsActGate.reactActPrivateDispatcher.passiveEffectsReady,
      continuationFlushingReady:
        testUtilsActGate.reactActPrivateDispatcher.continuationFlushingReady,
      executesQueuedWork:
        testUtilsActGate.reactActPrivateDispatcher.executesQueuedWork,
      executesEffects: testUtilsActGate.reactActPrivateDispatcher.executesEffects
    },
    reactActQueueMetadata: {
      rendererBackedActDrainDiagnosticsReady:
        actQueueMetadata.rendererBackedActDrainDiagnosticsReady,
      consumesRendererBackedActDrainDiagnostics:
        actQueueMetadata.consumesRendererBackedActDrainDiagnostics,
      drainsAcceptedRendererBackedActDiagnostics:
        actQueueMetadata.drainsAcceptedRendererBackedActDiagnostics,
      drainsPublicReactActQueue: actQueueMetadata.drainsPublicReactActQueue,
      publicReactActCompatibilityClaimed:
        actQueueMetadata.publicReactActCompatibilityClaimed,
      executesQueuedWork: actQueueMetadata.executesQueuedWork,
      executesEffects: actQueueMetadata.executesEffects,
      executesRendererRoots: actQueueMetadata.executesRendererRoots,
      acceptedRendererBackedActDrainReconcilerRecords:
        actQueueMetadata.acceptedRendererBackedActDrainReconcilerRecords
    },
    rendererBackedActDrainDiagnostics: {
      status: rendererBackedDiagnostics.status,
      kind: rendererBackedDiagnostics.kind,
      renderer: rendererBackedDiagnostics.renderer,
      acceptedSchedulerRecords:
        rendererBackedDiagnostics.acceptedSchedulerRecords,
      acceptedReconcilerRecords:
        rendererBackedDiagnostics.acceptedReconcilerRecords,
      acceptedRendererRecords: rendererBackedDiagnostics.acceptedRendererRecords,
      drainsPublicReactActQueue:
        rendererBackedDiagnostics.drainsPublicReactActQueue,
      publicReactActCompatibilityClaimed:
        rendererBackedDiagnostics.publicReactActCompatibilityClaimed,
      executesQueuedWork: rendererBackedDiagnostics.executesQueuedWork,
      executesEffects: rendererBackedDiagnostics.executesEffects,
      executesRendererRoots: rendererBackedDiagnostics.executesRendererRoots
    },
    rendererBackedActDrainConsumption: {
      status: rendererBackedConsumption.status,
      accepted: rendererBackedConsumption.accepted,
      renderer: rendererBackedConsumption.renderer,
      drainsPublicReactActQueue:
        rendererBackedConsumption.drainsPublicReactActQueue,
      publicReactActCompatibilityClaimed:
        rendererBackedConsumption.publicReactActCompatibilityClaimed,
      executesQueuedWork: rendererBackedConsumption.executesQueuedWork,
      executesEffects: rendererBackedConsumption.executesEffects,
      executesRendererRoots: rendererBackedConsumption.executesRendererRoots,
      drainSummary: rendererBackedConsumption.drainSummary
    },
    reactDomTestUtilsActGate: {
      id: testUtilsActGate.id,
      status: testUtilsActGate.status,
      privatePrerequisitesPresent: testUtilsActGate.privatePrerequisitesPresent,
      privateRoutingReady: testUtilsActGate.privateRoutingReady,
      publicReactActReady: testUtilsActGate.publicReactActReady,
      publicTestUtilsActReady: testUtilsActGate.publicTestUtilsActReady,
      publicCompatibilityClaimed: testUtilsActGate.publicCompatibilityClaimed,
      acceptedPrivatePrerequisiteIds:
        testUtilsActGate.acceptedPrivatePrerequisiteIds,
      blockedPublicPrerequisiteIds:
        testUtilsActGate.blockedPublicPrerequisiteIds,
      publicPrerequisitesStillBlocked:
        testUtilsActGate.publicPrerequisitesStillBlocked,
      sideEffectPolicy: testUtilsActGate.sideEffectPolicy
    }
  };
}

function summarizePrivatePassiveEvidence(testUtilsActGate) {
  return {
    passiveEffects: testUtilsActGate.passiveEffects,
    passiveEffectCallbackHandles: testUtilsActGate.passiveEffectCallbackHandles,
    syncFlushPostPassiveContinuationExecution:
      testUtilsActGate.syncFlushPostPassiveContinuationExecution
  };
}

function runPrivateWarningBoundaryDiagnosticScenario({
  mode,
  modules,
  scenarioId
}) {
  try {
    if (scenarioId !== "development-warning-boundaries") {
      throw new Error(
        `No private warning-boundary diagnostic plan for scenario: ${scenarioId}`
      );
    }

    const modeWarningEnabled = mode.nodeEnv !== "production";
    const bridge = modules.rootBridge.createPrivateRootBridgeShell({
      markerOptions: {
        development: modeWarningEnabled
      },
      requestIdPrefix: "warning-boundary-request",
      rootIdPrefix: "warning-boundary-root",
      updateIdPrefix: "warning-boundary-update"
    });
    const document = createPrivateBridgeDocument({
      domContainer: modules.domContainer,
      label: `${mode.id}:${scenarioId}:warning-boundary`
    });
    const container = createPrivateBridgeElement({
      domContainer: modules.domContainer,
      nodeName: "DIV",
      ownerDocument: document
    });
    const create = bridge.createClientRoot(container);
    const element = createPrivateBridgeElementValue("object");
    const containerSecondArgument = createPrivateBridgeElement({
      domContainer: modules.domContainer,
      nodeName: "SECTION",
      ownerDocument: document
    });

    const callbackSecondArg = bridge.renderContainer(
      create.handle,
      element,
      function afterRender() {}
    );
    const containerSecondArg = bridge.renderContainer(
      create.handle,
      element,
      containerSecondArgument
    );
    const genericSecondArg = bridge.renderContainer(create.handle, element, {
      unexpected: true
    });
    const unmountCallback = bridge.unmountContainer(
      create.handle,
      function afterUnmount() {}
    );
    const duplicateBoundary = runPrivateDuplicateCreateRootWarningBoundary({
      modeWarningEnabled,
      modules
    });

    return {
      modeId: mode.id,
      scenarioId,
      status: "ok",
      evidence: {
        compatibilityClaimed: false,
        comparedToReactDomOracle: false,
        consoleOutputCaptured: false,
        consoleOutputUsedAsEvidence: false,
        diagnosticKind: "private-root-warning-boundary",
        modeWarningEnabled,
        publicRootCompatibilitySurface: false,
        warningBoundaryEvidence: {
          boundaries: [
            summarizePrivateWarningArgumentBoundary({
              argumentClassification: {
                isValidContainer: false,
                type: "function"
              },
              boundaryId: "root-render-callback-second-argument",
              modeWarningEnabled,
              reactDomSourceBoundary:
                "ReactDOMRoot.render __DEV__ args[1] function",
              record: callbackSecondArg
            }),
            summarizePrivateWarningArgumentBoundary({
              argumentClassification: {
                isValidContainer: true,
                nodeType: containerSecondArgument.nodeType,
                type: "object"
              },
              boundaryId: "root-render-container-second-argument",
              modeWarningEnabled,
              reactDomSourceBoundary:
                "ReactDOMRoot.render __DEV__ args[1] valid container",
              record: containerSecondArg
            }),
            summarizePrivateWarningArgumentBoundary({
              argumentClassification: {
                isValidContainer: false,
                type: "object"
              },
              boundaryId: "root-render-generic-second-argument",
              modeWarningEnabled,
              reactDomSourceBoundary:
                "ReactDOMRoot.render __DEV__ args[1] defined non-container",
              record: genericSecondArg
            }),
            summarizePrivateWarningArgumentBoundary({
              argumentClassification: {
                isValidContainer: false,
                type: "function"
              },
              boundaryId: "root-unmount-callback-argument",
              modeWarningEnabled,
              reactDomSourceBoundary:
                "ReactDOMRoot.unmount __DEV__ args[0] function",
              record: unmountCallback
            }),
            duplicateBoundary
          ],
          consoleOutputUsedAsEvidence: false,
          publicRootCompatibilitySurface: false
        }
      }
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

function runPrivateDuplicateCreateRootWarningBoundary({
  modeWarningEnabled,
  modules
}) {
  const bridge = modules.rootBridge.createPrivateRootBridgeShell({
    markerOptions: {
      development: modeWarningEnabled
    },
    requestIdPrefix: "warning-duplicate-request",
    rootIdPrefix: "warning-duplicate-root",
    sideEffectIdPrefix: "warning-duplicate-side-effect"
  });
  const document = createPrivateBridgeDocument({
    domContainer: modules.domContainer,
    label: `warning-boundary-duplicate:${modeWarningEnabled}`
  });
  const container = createPrivateBridgeElement({
    domContainer: modules.domContainer,
    nodeName: "DIV",
    ownerDocument: document
  });
  const firstCreate = bridge.createClientRoot(container);
  const sideEffect = bridge.applyCreateRootSideEffects(firstCreate);
  const isContainerMarkedBeforeSecondCreate =
    modules.rootMarkers.isContainerMarkedAsRoot(container);
  const secondCreate = bridge.createClientRoot(container);
  const cleanup = bridge.revertCreateRootSideEffects(sideEffect);

  return {
    argumentClassification: {
      isContainerMarkedAsRootBeforeSecondCreate:
        isContainerMarkedBeforeSecondCreate,
      isValidContainer: modules.domContainer.isValidContainer(container),
      type: "object"
    },
    boundaryId: "duplicate-create-root",
    consoleOutputUsedAsEvidence: false,
    duplicateWarningType: secondCreate.markerGuard.warning?.type ?? null,
    firstCreateMarkerWarning: firstCreate.markerGuard.warning,
    modeWarningEnabled,
    privateEvidenceKind: "private-root-create-markerGuard",
    publicRootCompatibilitySurface: false,
    reactDomSourceBoundary:
      "warnIfReactDOMContainerInDEV isContainerMarkedAsRoot",
    record: summarizePrivateWarningCreateBoundaryRecord(secondCreate),
    rootSideEffects: {
      afterCleanup: inspectRootFacadeSideEffects(
        container,
        document,
        modules.rootMarkers,
        modules.listenerRegistry
      ),
      cleanup: summarizePrivateRootCreateSideEffectCleanupRecord(cleanup),
      sideEffect: summarizePrivateRootCreateSideEffectRecord(sideEffect)
    },
    secondCreateMarkerWarning: secondCreate.markerGuard.warning,
    warningEmission:
      modeWarningEnabled && secondCreate.markerGuard.warning !== null
        ? "development-warning-boundary"
        : "production-warning-disabled"
  };
}

function createPrivateHostOutputHarness({ mode, modules, scenarioId }) {
  const document = createPrivateHostOutputDocument({
    domContainer: modules.domContainer,
    label: `${mode.id}:${scenarioId}:host-output`
  });
  const container = document.createElement("div");
  const bridge = modules.rootBridge.createPrivateRootBridgeShell({
    requestIdPrefix: "host-output-request",
    rootIdPrefix: "host-output-root",
    sideEffectIdPrefix: "host-output-side-effect",
    updateIdPrefix: "host-output-update"
  });
  const create = bridge.createClientRoot(container);
  const harness = {
    bridge,
    container,
    create,
    document,
    mode,
    modules,
    nativeHandoffRecords: [],
    requestAdmissionRecords: [],
    requestRecords: [],
    scenarioId,
    thrownOperations: [],
    rootOwner: modules.rootBridge.getRootOwnerFromHandle(create.handle)
  };
  recordPrivateHostOutputRootRequest(harness, create);
  return harness;
}

function createPrivateCrossRootSchedulingHarness({ mode, modules, scenarioId }) {
  const document = createPrivateHostOutputDocument({
    domContainer: modules.domContainer,
    label: `${mode.id}:${scenarioId}:cross-root-scheduling`
  });
  const container = document.createElement("div");
  const bridge = modules.rootBridge.createPrivateRootBridgeShell({
    requestIdPrefix: "cross-root-scheduling-request",
    rootIdPrefix: "cross-root-scheduling-root",
    sideEffectIdPrefix: "cross-root-scheduling-side-effect",
    updateIdPrefix: "cross-root-scheduling-update"
  });
  const create = bridge.createClientRoot(container);
  const harness = {
    bridge,
    container,
    create,
    document,
    mode,
    modules,
    nativeHandoffRecords: [],
    requestAdmissionRecords: [],
    requestRecords: [],
    scenarioId,
    thrownOperations: [],
    rootOwner: modules.rootBridge.getRootOwnerFromHandle(create.handle)
  };
  recordPrivateHostOutputRootRequest(harness, create);
  return harness;
}

function recordPrivateHostOutputRootRequest(harness, record) {
  harness.requestRecords.push(normalizePrivateBridgeRequestRecord(record));
  harness.requestAdmissionRecords.push(
    summarizePrivateRootBridgeAdmissionRecord(harness.bridge.admitRequest(record))
  );
  harness.nativeHandoffRecords.push(
    summarizeNativeRootBridgeHandoffRecord(
      harness.bridge.createNativeRequestHandoff(record)
    )
  );
}

function applyPrivateHostOutputRootSideEffects(harness) {
  return applyPrivateHostOutputRootSideEffectsForRoot(harness, {
    container: harness.container,
    create: harness.create,
    document: harness.document
  });
}

function applyPrivateHostOutputRootSideEffectsForRoot(harness, root) {
  const before = summarizePrivateRootMarkerListenerState({
    container: root.container,
    document: root.document,
    modules: harness.modules
  });
  const record = harness.bridge.applyCreateRootSideEffects(root.create);
  const afterApply = summarizePrivateRootMarkerListenerState({
    container: root.container,
    document: root.document,
    modules: harness.modules
  });
  return {
    afterApply,
    before,
    rawRecord: record,
    record: summarizePrivateRootCreateSideEffectRecord(record)
  };
}

function cleanupPrivateHostOutputRootSideEffects(harness, rawRecord) {
  return cleanupPrivateHostOutputRootSideEffectsForRoot(
    harness,
    {
      container: harness.container,
      document: harness.document
    },
    rawRecord
  );
}

function cleanupPrivateHostOutputRootSideEffectsForRoot(
  harness,
  root,
  rawRecord
) {
  const cleanupRecord = harness.bridge.revertCreateRootSideEffects(rawRecord);
  return {
    afterCleanup: summarizePrivateRootMarkerListenerState({
      container: root.container,
      document: root.document,
      modules: harness.modules
    }),
    record: summarizePrivateRootCreateSideEffectCleanupRecord(cleanupRecord)
  };
}

function mountPrivateInitialHostOutput(harness) {
  const previousProps = {};
  const nextProps = createPrivateHostOutputProps("initial");
  const host = harness.document.createElement("div");
  const token = harness.modules.componentTree.createHostInstanceToken(
    {
      kind: "PrivateHostOutputDiagnosticHost",
      phase: "initial"
    },
    harness.rootOwner
  );
  harness.modules.componentTree.attachHostInstanceNode(
    host,
    token,
    previousProps
  );
  const handoff = harness.modules.domHost.commitDomPropertyUpdateForLatestProps(
    host,
    "div",
    previousProps,
    nextProps
  );
  const latestPropsBeforeCommit =
    harness.modules.componentTree.getLatestPropsFromNode(host);
  const handoffPayload =
    harness.modules.domHost.getDomPropertyUpdateLatestPropsHandoffPayload(
      handoff
    );
  harness.modules.componentTree.commitLatestPropsFromMutationHandoff(handoff);
  const latestPropsAfterCommit =
    harness.modules.componentTree.getLatestPropsFromNode(host);
  const text = harness.modules.domHost.createDomHostTextInstance(
    "hello",
    harness.container
  );

  harness.modules.domHost.appendInitialChild(host, text);
  harness.modules.domHost.appendChildToContainer(harness.container, host);

  return {
    attributes: summarizeAttributeEntries(host),
    childNodeNames: summarizeChildNodeNames(harness.container),
    containerChildCount: harness.container.childNodes.length,
    containerMutationLog: harness.container.mutationLog.slice(),
    containerTextContent: harness.container.textContent,
    handoff: summarizePrivateHostOutputHandoff(handoff, handoffPayload),
    hostAttributeLog: host.attributeLog.slice(),
    hostMutationObserved: true,
    latestPropsAfterCommit: summarizePrivateHostOutputProps(
      latestPropsAfterCommit
    ),
    latestPropsBeforeCommit: summarizePrivateHostOutputProps(
      latestPropsBeforeCommit
    ),
    latestPropsPublished: latestPropsAfterCommit === nextProps,
    textNodeValue: text.nodeValue,
    textWriteLog: text.writeLog.slice()
  };
}

function updatePrivateHostOutput(harness, mounted) {
  const host = harness.container.childNodes[0];
  const text = host.childNodes[0];
  const previousProps =
    harness.modules.componentTree.getLatestPropsFromNode(host);
  const nextProps = createPrivateHostOutputProps("updated");
  const handoff = harness.modules.domHost.commitDomPropertyUpdateForLatestProps(
    host,
    "div",
    previousProps,
    nextProps
  );
  const latestPropsBeforeCommit =
    harness.modules.componentTree.getLatestPropsFromNode(host);
  const handoffPayload =
    harness.modules.domHost.getDomPropertyUpdateLatestPropsHandoffPayload(
      handoff
    );
  harness.modules.domHost.commitTextUpdate(text, "hello", "goodbye");
  harness.modules.componentTree.commitLatestPropsFromMutationHandoff(handoff);
  const latestPropsAfterCommit =
    harness.modules.componentTree.getLatestPropsFromNode(host);

  return {
    ...mounted,
    attributes: summarizeAttributeEntries(host),
    childNodeNames: summarizeChildNodeNames(harness.container),
    containerChildCount: harness.container.childNodes.length,
    containerTextContent: harness.container.textContent,
    handoff: summarizePrivateHostOutputHandoff(handoff, handoffPayload),
    hostAttributeLog: host.attributeLog.slice(),
    latestPropsAfterCommit: summarizePrivateHostOutputProps(
      latestPropsAfterCommit
    ),
    latestPropsBeforeCommit: summarizePrivateHostOutputProps(
      latestPropsBeforeCommit
    ),
    latestPropsPublished: latestPropsAfterCommit === nextProps,
    textNodeValue: text.nodeValue,
    textWriteLog: text.writeLog.slice(),
    updateMutationObserved: true
  };
}

function mountPrivateReplacementInitialHostOutput(harness) {
  const previousProps = {};
  const nextProps = createPrivateHostOutputProps("replace-before");
  const host = harness.document.createElement("span");
  const token = harness.modules.componentTree.createHostInstanceToken(
    {
      kind: "PrivateHostOutputDiagnosticHost",
      phase: "replace-before"
    },
    harness.rootOwner
  );
  harness.modules.componentTree.attachHostInstanceNode(
    host,
    token,
    previousProps
  );
  const handoff = harness.modules.domHost.commitDomPropertyUpdateForLatestProps(
    host,
    "span",
    previousProps,
    nextProps
  );
  const handoffPayload =
    harness.modules.domHost.getDomPropertyUpdateLatestPropsHandoffPayload(
      handoff
    );
  harness.modules.componentTree.commitLatestPropsFromMutationHandoff(handoff);
  const latestPropsAfterCommit =
    harness.modules.componentTree.getLatestPropsFromNode(host);
  const text = harness.modules.domHost.createDomHostTextInstance(
    "before",
    harness.container
  );

  harness.modules.domHost.appendInitialChild(host, text);
  harness.modules.domHost.appendChildToContainer(harness.container, host);

  return {
    initialAttributes: summarizeAttributeEntries(host),
    initialChildNodeNames: summarizeChildNodeNames(harness.container),
    initialContainerTextContent: harness.container.textContent,
    initialHandoff: summarizePrivateHostOutputHandoff(
      handoff,
      handoffPayload
    ),
    initialLatestPropsPublished: latestPropsAfterCommit === nextProps
  };
}

function replacePrivateHostOutput(harness, mounted) {
  const previousHost = harness.container.childNodes[0];
  const replaceMutationStart = harness.container.mutationLog.length;
  harness.modules.domHost.removeChildFromContainer(
    harness.container,
    previousHost
  );
  harness.modules.componentTree.detachHostInstanceNode(previousHost);

  const replacementHost = harness.document.createElement("section");
  const replacementPreviousProps = {};
  const replacementNextProps = createPrivateHostOutputProps("replace-after");
  const replacementToken =
    harness.modules.componentTree.createHostInstanceToken(
      {
        kind: "PrivateHostOutputDiagnosticHost",
        phase: "replace-after"
      },
      harness.rootOwner
    );
  harness.modules.componentTree.attachHostInstanceNode(
    replacementHost,
    replacementToken,
    replacementPreviousProps
  );
  const replacementHandoff =
    harness.modules.domHost.commitDomPropertyUpdateForLatestProps(
      replacementHost,
      "section",
      replacementPreviousProps,
      replacementNextProps
    );
  const replacementHandoffPayload =
    harness.modules.domHost.getDomPropertyUpdateLatestPropsHandoffPayload(
      replacementHandoff
    );
  harness.modules.componentTree.commitLatestPropsFromMutationHandoff(
    replacementHandoff
  );
  const replacementLatestPropsAfterCommit =
    harness.modules.componentTree.getLatestPropsFromNode(replacementHost);

  const bold = harness.document.createElement("b");
  const boldPreviousProps = {};
  const boldNextProps = createPrivateHostOutputProps("replace-bold");
  const boldToken = harness.modules.componentTree.createHostInstanceToken(
    {
      kind: "PrivateHostOutputDiagnosticHost",
      phase: "replace-bold"
    },
    harness.rootOwner
  );
  harness.modules.componentTree.attachHostInstanceNode(
    bold,
    boldToken,
    boldPreviousProps
  );
  const boldHandoff =
    harness.modules.domHost.commitDomPropertyUpdateForLatestProps(
      bold,
      "b",
      boldPreviousProps,
      boldNextProps
    );
  const boldHandoffPayload =
    harness.modules.domHost.getDomPropertyUpdateLatestPropsHandoffPayload(
      boldHandoff
    );
  harness.modules.componentTree.commitLatestPropsFromMutationHandoff(
    boldHandoff
  );
  const boldLatestPropsAfterCommit =
    harness.modules.componentTree.getLatestPropsFromNode(bold);
  const text = harness.modules.domHost.createDomHostTextInstance(
    "after",
    harness.container
  );

  harness.modules.domHost.appendInitialChild(bold, text);
  harness.modules.domHost.appendInitialChild(replacementHost, bold);
  harness.modules.domHost.appendChildToContainer(
    harness.container,
    replacementHost
  );

  return {
    ...mounted,
    nestedChildNodeNames: summarizeChildNodeNames(replacementHost),
    nestedHandoff: summarizePrivateHostOutputHandoff(
      boldHandoff,
      boldHandoffPayload
    ),
    nestedLatestPropsPublished: boldLatestPropsAfterCommit === boldNextProps,
    removedHostDetachedFromLatestPropsMap:
      harness.modules.componentTree.getLatestPropsFromNode(previousHost) ===
      null,
    replaceAttributes: summarizeAttributeEntries(replacementHost),
    replaceChildNodeNames: summarizeChildNodeNames(harness.container),
    replaceContainerChildCount: harness.container.childNodes.length,
    replaceContainerTextContent: harness.container.textContent,
    replacementHandoff: summarizePrivateHostOutputHandoff(
      replacementHandoff,
      replacementHandoffPayload
    ),
    replacementLatestPropsPublished:
      replacementLatestPropsAfterCommit === replacementNextProps,
    replaceMutationLog: harness.container.mutationLog.slice(
      replaceMutationStart
    ),
    textNodeValue: text.nodeValue,
    textWriteLog: text.writeLog.slice()
  };
}

function renderNullPrivateHostOutput(harness, mounted) {
  const host = harness.container.childNodes[0] ?? null;
  const renderNullMutationStart = harness.container.mutationLog.length;
  if (host !== null) {
    harness.modules.domHost.clearContainer(harness.container);
    harness.modules.componentTree.detachHostInstanceNode(host);
  }

  return {
    ...mounted,
    childNodeNamesAfterRenderNull: summarizeChildNodeNames(harness.container),
    containerChildCountAfterRenderNull: harness.container.childNodes.length,
    containerTextContentAfterRenderNull: harness.container.textContent,
    hostDetachedFromLatestPropsMap:
      host === null
        ? false
        : harness.modules.componentTree.getLatestPropsFromNode(host) === null,
    renderNullMutationLog: harness.container.mutationLog.slice(
      renderNullMutationStart
    ),
    renderNullMutationObserved: true,
    rootSideEffectStateAfterRenderNull:
      summarizePrivateRootMarkerListenerState(harness)
  };
}

function unmountPrivateHostOutput(harness, mounted) {
  const host = harness.container.childNodes[0] ?? null;
  if (host !== null) {
    harness.modules.domHost.clearContainer(harness.container);
    harness.modules.componentTree.detachHostInstanceNode(host);
  }

  return {
    ...mounted,
    childNodeNamesAfterUnmount: summarizeChildNodeNames(harness.container),
    containerChildCountAfterUnmount: harness.container.childNodes.length,
    containerMutationLogAfterUnmount: harness.container.mutationLog.slice(),
    containerTextContentAfterUnmount: harness.container.textContent,
    hostDetachedFromLatestPropsMap:
      host === null
        ? false
        : harness.modules.componentTree.getLatestPropsFromNode(host) === null,
    unmountMutationObserved: true
  };
}

function recordPrivateDoubleUnmountNoop(harness, unmounted) {
  const secondUnmountMutationStart = harness.container.mutationLog.length;
  const secondUnmountRecord =
    harness.requestRecords[harness.requestRecords.length - 1];

  return {
    ...unmounted,
    childNodeNamesAfterSecondUnmount: summarizeChildNodeNames(
      harness.container
    ),
    containerChildCountAfterSecondUnmount: harness.container.childNodes.length,
    containerTextContentAfterSecondUnmount: harness.container.textContent,
    secondUnmountBridgeNoOp: secondUnmountRecord?.noOp === true,
    secondUnmountHostMutationObserved: false,
    secondUnmountMutationLog: harness.container.mutationLog.slice(
      secondUnmountMutationStart
    )
  };
}

function recordPrivateRenderAfterUnmountGuard(harness, unmounted) {
  const renderAfterUnmountMutationStart = harness.container.mutationLog.length;
  let thrownError = null;
  try {
    harness.bridge.renderContainer(
      harness.create.handle,
      createPrivateHostOutputElementValue("stale")
    );
  } catch (error) {
    thrownError = describePrivateBridgeError(error);
    harness.thrownOperations.push({
      operation: "root.render",
      error: thrownError
    });
  }

  if (thrownError === null) {
    throw new Error("Private host-output render-after-unmount did not throw.");
  }

  return {
    ...unmounted,
    childNodeNamesAfterRenderAttempt: summarizeChildNodeNames(
      harness.container
    ),
    containerChildCountAfterRenderAttempt: harness.container.childNodes.length,
    containerTextContentAfterRenderAttempt: harness.container.textContent,
    renderAfterUnmountError: thrownError,
    renderAfterUnmountHostMutationObserved: false,
    renderAfterUnmountMutationLog: harness.container.mutationLog.slice(
      renderAfterUnmountMutationStart
    )
  };
}

function flushSyncCrossRootPrivateHostOutput(harness) {
  const firstRoot = {
    container: harness.container,
    create: harness.create,
    document: harness.document,
    rootOwner: harness.rootOwner
  };
  const secondRoot = createAdditionalPrivateHostOutputRoot(
    harness,
    "cross-root-b"
  );
  recordPrivateHostOutputRootRequest(harness, secondRoot.create);
  const secondSideEffects =
    applyPrivateHostOutputRootSideEffectsForRoot(harness, secondRoot);
  const { rawRecord: secondRawSideEffectRecord, ...secondSideEffectEvidence } =
    secondSideEffects;

  const callbackEvents = [];
  const firstRender = harness.bridge.renderContainer(
    firstRoot.create.handle,
    createPrivateHostOutputElementValue("cross-a")
  );
  recordPrivateHostOutputRootRequest(harness, firstRender);
  callbackEvents.push("root.render:first");
  const secondRender = harness.bridge.renderContainer(
    secondRoot.create.handle,
    createPrivateHostOutputElementValue("cross-b")
  );
  recordPrivateHostOutputRootRequest(harness, secondRender);
  callbackEvents.push("root.render:second");

  const flushSyncWarnings = [];
  const flushSyncWorkWasInRender =
    harness.modules.flushSyncGuard.finishFlushSyncGuard(
      {
        f() {
          callbackEvents.push("flushSyncWork");
          return false;
        }
      },
      {
        console: {
          error(message) {
            flushSyncWarnings.push(message);
          }
        },
        development: harness.mode.nodeEnv !== "production"
      }
    );
  const rootSideEffectStateAfterFlush = {
    first: summarizePrivateRootMarkerListenerState({
      container: firstRoot.container,
      document: firstRoot.document,
      modules: harness.modules
    }),
    second: summarizePrivateRootMarkerListenerState({
      container: secondRoot.container,
      document: secondRoot.document,
      modules: harness.modules
    })
  };
  const firstHostOutput = mountPrivateCrossRootHostOutput(
    harness,
    firstRoot,
    "cross-a"
  );
  const secondHostOutput = mountPrivateCrossRootHostOutput(
    harness,
    secondRoot,
    "cross-b"
  );
  const secondCleanup = cleanupPrivateHostOutputRootSideEffectsForRoot(
    harness,
    secondRoot,
    secondRawSideEffectRecord
  );

  return {
    firstRoot: firstHostOutput,
    flushSyncEvidence: {
      callbackEvents,
      callbackRenderRequestCount: 2,
      callbackReturnValue: "two-root-flush-complete",
      committedRootCountAfterFlush: 2,
      flushSyncGuardWarningCount: flushSyncWarnings.length,
      flushSyncWorkCallCount: callbackEvents.filter(
        (event) => event === "flushSyncWork"
      ).length,
      flushSyncWorkWasInRender,
      privateReconcilerDiagnostics:
        harness.modules.syncFlushCrossRootReconcilerDiagnostics,
      publicFlushSyncCompatibilityClaimed: false,
      rootSideEffectStateAfterFlush
    },
    secondRoot: secondHostOutput,
    secondRootSideEffectEvidence: {
      ...secondSideEffectEvidence,
      cleanup: secondCleanup
    }
  };
}

function createAdditionalPrivateHostOutputRoot(harness, label) {
  const document = createPrivateHostOutputDocument({
    domContainer: harness.modules.domContainer,
    label: `${harness.mode.id}:${harness.scenarioId}:${label}:host-output`
  });
  const container = document.createElement("div");
  const create = harness.bridge.createClientRoot(container);
  return {
    container,
    create,
    document,
    rootOwner: harness.modules.rootBridge.getRootOwnerFromHandle(create.handle)
  };
}

function mountPrivateCrossRootHostOutput(harness, root, phase) {
  const previousProps = {};
  const nextProps = createPrivateHostOutputProps(phase);
  const host = root.document.createElement("div");
  const token = harness.modules.componentTree.createHostInstanceToken(
    {
      kind: "PrivateHostOutputDiagnosticHost",
      phase
    },
    root.rootOwner
  );
  harness.modules.componentTree.attachHostInstanceNode(
    host,
    token,
    previousProps
  );
  const handoff = harness.modules.domHost.commitDomPropertyUpdateForLatestProps(
    host,
    "div",
    previousProps,
    nextProps
  );
  const latestPropsBeforeCommit =
    harness.modules.componentTree.getLatestPropsFromNode(host);
  const handoffPayload =
    harness.modules.domHost.getDomPropertyUpdateLatestPropsHandoffPayload(
      handoff
    );
  harness.modules.componentTree.commitLatestPropsFromMutationHandoff(handoff);
  const latestPropsAfterCommit =
    harness.modules.componentTree.getLatestPropsFromNode(host);
  const text = harness.modules.domHost.createDomHostTextInstance(
    nextProps.children,
    root.container
  );

  harness.modules.domHost.appendInitialChild(host, text);
  harness.modules.domHost.appendChildToContainer(root.container, host);

  return {
    attributes: summarizeAttributeEntries(host),
    childNodeNames: summarizeChildNodeNames(root.container),
    containerChildCount: root.container.childNodes.length,
    containerMutationLog: root.container.mutationLog.slice(),
    containerTextContent: root.container.textContent,
    handoff: summarizePrivateHostOutputHandoff(handoff, handoffPayload),
    hostMutationObserved: true,
    latestPropsAfterCommit: summarizePrivateHostOutputProps(
      latestPropsAfterCommit
    ),
    latestPropsBeforeCommit: summarizePrivateHostOutputProps(
      latestPropsBeforeCommit
    ),
    latestPropsPublished: latestPropsAfterCommit === nextProps,
    textNodeValue: text.nodeValue,
    textWriteLog: text.writeLog.slice()
  };
}

function summarizePrivateHostOutputRootBridgeEvidence(harness) {
  return {
    admissions: harness.requestAdmissionRecords.map((record) => ({
      admissionStatus: record.admissionStatus,
      compatibilityClaimed: record.compatibilityClaimed,
      executionStatus: record.executionStatus,
      operation: record.operation,
      requestType: record.requestType
    })),
    nativeHandoffs: harness.nativeHandoffRecords,
    requestNoOps: harness.requestRecords.map((record) => record.noOp ?? false),
    requestOperations: harness.requestRecords.map((record) => record.operation),
    requestRecordCount: harness.requestRecords.length,
    requestTypes: harness.requestRecords.map((record) => record.requestType),
    thrownOperations: harness.thrownOperations
  };
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

function getRootFacadeListenerRegistrationCount(sideEffects) {
  return (
    sideEffects.listenerRegistrationCount +
    sideEffects.ownerDocumentListenerRegistrationCount
  );
}

function getRootFacadeMutationCount(sideEffects) {
  return sideEffects.mutationCount + sideEffects.ownerDocumentMutationCount;
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

function summarizePrivateRootBridgeAdmissionRecord(record) {
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
    admissionStatus: record.admissionStatus,
    executionStatus: record.executionStatus,
    compatibilityStatus: record.compatibilityStatus,
    lifecyclePrerequisites: record.lifecyclePrerequisites,
    blockedCapabilities: record.blockedCapabilities.map((capability) => ({
      blocked: capability.blocked,
      id: capability.id
    })),
    nativeExecution: record.nativeExecution,
    reconcilerExecution: record.reconcilerExecution,
    domMutation: record.domMutation,
    markerWrites: record.markerWrites,
    listenerInstallation: record.listenerInstallation,
    hydration: record.hydration,
    eventDispatch: record.eventDispatch,
    compatibilityClaimed: record.compatibilityClaimed
  };
}

function summarizeNativeRootBridgeHandoffRecord(record) {
  return {
    compatibilityClaimed: record.compatibilityClaimed,
    domMutation: record.domMutation,
    eventDispatch: record.eventDispatch,
    handoffStatus: record.handoffStatus,
    hydration: record.hydration,
    listenerInstallation: record.listenerInstallation,
    markerWrites: record.markerWrites,
    nativeExecution: record.nativeExecution,
    nativeRequestKind: record.nativeRequestRecord?.kind ?? null,
    nativeRootHandleState:
      record.nativeRequestRecord?.rootHandle?.state ?? null,
    operation: record.operation,
    reconcilerExecution: record.reconcilerExecution,
    requestType: record.sourceRequestType
  };
}

function summarizePrivateWarningArgumentBoundary({
  argumentClassification,
  boundaryId,
  modeWarningEnabled,
  reactDomSourceBoundary,
  record
}) {
  return {
    argumentClassification,
    boundaryId,
    callbackInfo: record.callbackInfo,
    consoleOutputUsedAsEvidence: false,
    modeWarningEnabled,
    privateEvidenceKind: "private-root-update-callbackInfo",
    publicRootCompatibilitySurface: false,
    reactDomSourceBoundary,
    record: summarizePrivateWarningUpdateBoundaryRecord(record),
    warningEmission: modeWarningEnabled
      ? "development-warning-boundary"
      : "production-warning-disabled"
  };
}

function summarizePrivateWarningUpdateBoundaryRecord(record) {
  return {
    compatibilityClaimed: record.compatibilityClaimed,
    domMutation: record.domMutation,
    eventDispatch: record.eventDispatch,
    hydration: record.hydration,
    listenerInstallation: record.listenerInstallation,
    markerWrites: record.markerWrites,
    nativeExecution: record.nativeExecution,
    operation: record.operation,
    reconcilerExecution: record.reconcilerExecution,
    requestType: record.requestType
  };
}

function summarizePrivateWarningCreateBoundaryRecord(record) {
  return {
    compatibilityClaimed: record.compatibilityClaimed,
    domMutation: record.domMutation,
    eventDispatch: record.eventDispatch,
    hydration: record.hydration,
    listenerInstallation: record.listenerInstallation,
    markerGuard: record.markerGuard,
    markerWrites: record.markerWrites,
    nativeExecution: record.nativeExecution,
    operation: record.operation,
    reconcilerExecution: record.reconcilerExecution,
    requestType: record.requestType
  };
}

function summarizePrivateRootCreateSideEffectRecord(record) {
  return {
    compatibilityClaimed: record.compatibilityClaimed,
    domMutation: record.domMutation,
    eventDispatch: record.eventDispatch,
    hydration: record.hydration,
    listenerInstallation: record.listenerInstallation,
    listenerRegistrationCount:
      record.listenerRegistration?.registrationCount ?? 0,
    markerStatus: record.markerRecord?.markerStatus ?? null,
    markerWrites: record.markerWrites,
    nativeExecution: record.nativeExecution,
    reconcilerExecution: record.reconcilerExecution,
    reversible: record.reversible,
    sideEffectStatus: record.sideEffectStatus
  };
}

function summarizePrivateRootCreateSideEffectCleanupRecord(record) {
  return {
    compatibilityClaimed: record.compatibilityClaimed,
    domMutation: record.domMutation,
    eventDispatch: record.eventDispatch,
    hydration: record.hydration,
    listenerInstallation: record.listenerInstallation,
    listenerRemovalCount: record.listenerCleanup?.listenerRemovalCount ?? 0,
    markerCleanupStatus: record.markerCleanup?.markerStatus ?? null,
    markerWrites: record.markerWrites,
    nativeExecution: record.nativeExecution,
    reconcilerExecution: record.reconcilerExecution,
    reversible: record.reversible,
    sideEffectStatus: record.sideEffectStatus
  };
}

function summarizePrivateRootMarkerListenerState({
  container,
  document,
  modules
}) {
  const containerMarker =
    modules.rootMarkers.inspectContainerRootMarker(container);
  const containerListening =
    modules.listenerRegistry.inspectListeningMarker(container);
  const documentListening =
    modules.listenerRegistry.inspectListeningMarker(document);

  return {
    containerListenerRegistrationCount: container.__registrations.length,
    containerListeningMarkerPropertyCount: containerListening.propertyCount,
    containerMarkerPropertyCount: containerMarker.propertyCount,
    containerMarkerTruthyCount: containerMarker.truthyCount,
    ownerDocumentListenerRegistrationCount: document.__registrations.length,
    ownerDocumentListeningMarkerPropertyCount: documentListening.propertyCount
  };
}

function summarizePrivateHostOutputHandoff(handoff, payload) {
  return {
    kind: handoff.kind,
    latestPropsCommitRecordKind: payload.latestPropsCommitRecord.kind,
    latestPropsCommitRecordStatus: payload.latestPropsCommitRecord.status,
    mutationRecordCount: payload.mutationRecords.length,
    payloadCount: handoff.payloadCount,
    status: handoff.status
  };
}

function summarizePrivateHostOutputProps(props) {
  if (props == null || typeof props !== "object") {
    return describeLocalValue(props);
  }

  return Object.fromEntries(
    Object.entries(props).map(([key, value]) => [
      key,
      typeof value === "function" ? { type: "function" } : value
    ])
  );
}

function summarizeAttributeEntries(element) {
  return Array.from(element.attributes.entries()).sort(([left], [right]) =>
    left.localeCompare(right)
  );
}

function summarizeChildNodeNames(parent) {
  return parent.childNodes.map((child) => child.nodeName);
}

function createPrivateHostOutputProps(phase) {
  if (phase === "updated") {
    return {
      id: "message",
      className: "root-card updated",
      title: "updated title",
      "data-phase": "updated",
      children: "goodbye"
    };
  }
  if (phase === "replace-before") {
    return {
      id: "replace-before",
      title: "before",
      children: "before"
    };
  }
  if (phase === "replace-after") {
    return {
      id: "replace-after",
      title: "after",
      children: {
        props: createPrivateHostOutputProps("replace-bold"),
        type: "b"
      }
    };
  }
  if (phase === "replace-bold") {
    return {
      children: "after"
    };
  }
  if (phase === "stale") {
    return {
      children: "stale"
    };
  }
  if (phase === "cross-a") {
    return {
      id: "cross-a",
      children: "A"
    };
  }
  if (phase === "cross-b") {
    return {
      id: "cross-b",
      children: "B"
    };
  }

  return {
    id: "message",
    className: "root-card",
    title: "initial title",
    "data-phase": "initial",
    children: "hello"
  };
}

function createPrivateHostOutputElementValue(phase) {
  return {
    props: createPrivateHostOutputProps(phase),
    type: "div"
  };
}

function summarizePrivateRootPortalBoundaryRecord(record) {
  return {
    $$typeof: record.$$typeof,
    acceptedPortalObjectShape: record.acceptedPortalObjectShape,
    blockedCapabilities: record.blockedCapabilities.map((capability) => ({
      blocked: capability.blocked,
      id: capability.id
    })),
    boundaryId: record.boundaryId,
    boundarySequence: record.boundarySequence,
    boundaryStatus: record.boundaryStatus,
    compatibilityClaimed: record.compatibilityClaimed,
    diagnosticStatus: record.diagnosticStatus,
    domMutation: record.domMutation,
    eventDispatch: record.eventDispatch,
    hydration: record.hydration,
    kind: record.kind,
    listenerInstallation: record.listenerInstallation,
    markerWrites: record.markerWrites,
    nativeExecution: record.nativeExecution,
    operation: record.operation,
    portalChildReconciliation: record.portalChildReconciliation,
    portalChildrenInfo: record.portalChildrenInfo,
    portalContainerInfo: record.portalContainerInfo,
    portalImplementationInfo: record.portalImplementationInfo,
    portalKey: record.portalKey,
    portalListenerGuard: record.portalListenerGuard,
    portalMounting: record.portalMounting,
    portalObjectInfo: record.portalObjectInfo,
    privatePortalMetadataPromotesPublicRootRender:
      record.privatePortalMetadataPromotesPublicRootRender,
    publicDomMutation: record.publicDomMutation,
    publicPortalMounting: record.publicPortalMounting,
    publicRootCompatibilitySurface: record.publicRootCompatibilitySurface,
    publicRootRenderCompatibilityClaimed:
      record.publicRootRenderCompatibilityClaimed,
    reconcilerDiagnostic: record.reconcilerDiagnostic,
    reconcilerExecution: record.reconcilerExecution,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    sourceLifecycleStatusAfter: record.sourceLifecycleStatusAfter,
    sourceLifecycleStatusBefore: record.sourceLifecycleStatusBefore,
    sourceOperation: record.sourceOperation,
    sourceRequestId: record.sourceRequestId,
    sourceRequestSequence: record.sourceRequestSequence,
    sourceRequestType: record.sourceRequestType,
    sourceUpdateId: record.sourceUpdateId
  };
}

function summarizePrivateRootPortalPrepareMountListenerIntentRecord(record) {
  return {
    acceptedCapabilities: record.acceptedCapabilities.map((capability) => ({
      accepted: capability.accepted,
      id: capability.id
    })),
    blockedCapabilities: record.blockedCapabilities.map((capability) => ({
      blocked: capability.blocked,
      id: capability.id
    })),
    compatibilityClaimed: record.compatibilityClaimed,
    domMutation: record.domMutation,
    eventDispatch: record.eventDispatch,
    intentId: record.intentId,
    intentStatus: record.intentStatus,
    kind: record.kind,
    listenerInstallation: record.listenerInstallation,
    listenerInstallationStatus: record.listenerInstallationStatus,
    operation: record.operation,
    preparePortalMount: record.preparePortalMount,
    preparePortalMountIntent: record.preparePortalMountIntent,
    privatePortalMetadataPromotesPublicRootRender:
      record.privatePortalMetadataPromotesPublicRootRender,
    publicDomMutation: record.publicDomMutation,
    publicPortalMounting: record.publicPortalMounting,
    publicRootCompatibilitySurface: record.publicRootCompatibilitySurface,
    publicRootRenderCompatibilityClaimed:
      record.publicRootRenderCompatibilityClaimed,
    reconcilerExecution: record.reconcilerExecution,
    rootId: record.rootId,
    sourceBoundaryId: record.sourceBoundaryId
  };
}

function summarizePrivateRootPortalFakeDomMountRecord(record) {
  return {
    acceptedCapabilities: record.acceptedCapabilities.map((capability) => ({
      accepted: capability.accepted,
      id: capability.id
    })),
    blockedCapabilities: record.blockedCapabilities.map((capability) => ({
      blocked: capability.blocked,
      id: capability.id
    })),
    compatibilityClaimed: record.compatibilityClaimed,
    componentTreeMetadataAttached: record.componentTreeMetadataAttached,
    domMutation: record.domMutation,
    eventDispatch: record.eventDispatch,
    fakeDomCommitApplied: record.fakeDomCommitApplied,
    fakeDomPortalMountDiagnostic: record.fakeDomPortalMountDiagnostic,
    hostComponentType: record.hostComponentType,
    kind: record.kind,
    listenerInstallation: record.listenerInstallation,
    mountDiagnosticId: record.mountDiagnosticId,
    mountStatus: record.mountStatus,
    operation: record.operation,
    portalChildReconciliation: record.portalChildReconciliation,
    portalContainerChildCountAfter: record.portalContainerChildCountAfter,
    portalContainerChildrenReplaced: record.portalContainerChildrenReplaced,
    portalMounting: record.portalMounting,
    privatePortalMetadataPromotesPublicRootRender:
      record.privatePortalMetadataPromotesPublicRootRender,
    publicDomMutation: record.publicDomMutation,
    publicMountStatus: record.publicMountStatus,
    publicPortalMounting: record.publicPortalMounting,
    publicRootCompatibilitySurface: record.publicRootCompatibilitySurface,
    publicRootRenderCompatibilityClaimed:
      record.publicRootRenderCompatibilityClaimed,
    reconcilerExecution: record.reconcilerExecution,
    rootId: record.rootId,
    sourceCommitHandoffId: record.sourceCommitHandoffId
  };
}

function summarizePrivateRootPortalEventOwnerRootGateRecord(record) {
  return {
    acceptedCapabilities: record.acceptedCapabilities.map((capability) => ({
      accepted: capability.accepted,
      id: capability.id
    })),
    blockedCapabilities: record.blockedCapabilities.map((capability) => ({
      blocked: capability.blocked,
      id: capability.id
    })),
    browserDomEventCompatibilityClaimed:
      record.browserDomEventCompatibilityClaimed,
    compatibilityClaimed: record.compatibilityClaimed,
    domMutation: record.domMutation,
    eventBubblingStatus: record.eventBubblingStatus,
    eventDispatch: record.eventDispatch,
    fakeDomEventCompatibilityClaimed: record.fakeDomEventCompatibilityClaimed,
    gateId: record.gateId,
    gateStatus: record.gateStatus,
    kind: record.kind,
    listenerInstallation: record.listenerInstallation,
    operation: record.operation,
    ownerRootAttachment: record.ownerRootAttachment,
    portalEventBubbling: record.portalEventBubbling,
    portalEventPathDiagnostic: record.portalEventPathDiagnostic,
    portalOwnerRootAttached: record.portalOwnerRootAttached,
    privatePortalMetadataPromotesPublicRootRender:
      record.privatePortalMetadataPromotesPublicRootRender,
    publicDomMutation: record.publicDomMutation,
    publicPortalBubbling: record.publicPortalBubbling,
    publicPortalMounting: record.publicPortalMounting,
    publicRootCompatibilitySurface: record.publicRootCompatibilitySurface,
    publicRootRenderCompatibilityClaimed:
      record.publicRootRenderCompatibilityClaimed,
    reconcilerExecution: record.reconcilerExecution,
    rootId: record.rootId,
    syntheticEventCount: record.syntheticEventCount
  };
}

function summarizePrivateRootPortalChildReconciliationRecord(record) {
  return {
    acceptedCapabilities: record.acceptedCapabilities.map((capability) => ({
      accepted: capability.accepted,
      id: capability.id
    })),
    blockedCapabilities: record.blockedCapabilities.map((capability) => ({
      blocked: capability.blocked,
      id: capability.id
    })),
    compatibilityClaimed: record.compatibilityClaimed,
    diagnosticId: record.diagnosticId,
    domMutation: record.domMutation,
    eventDispatch: record.eventDispatch,
    fakeDomCommitApplied: record.fakeDomCommitApplied,
    fakeDomPortalMountDiagnostic: record.fakeDomPortalMountDiagnostic,
    hostComponentType: record.hostComponentType,
    kind: record.kind,
    latestPropsPublished: record.latestPropsPublished,
    latestPropsPublishOrder: record.latestPropsPublishOrder,
    listenerInstallation: record.listenerInstallation,
    operation: record.operation,
    portalChildReconciliation: record.portalChildReconciliation,
    portalContainerChildrenReplaced: record.portalContainerChildrenReplaced,
    portalHostComponentUpdated: record.portalHostComponentUpdated,
    portalHostTextUpdated: record.portalHostTextUpdated,
    portalMounting: record.portalMounting,
    privatePortalMetadataPromotesPublicRootRender:
      record.privatePortalMetadataPromotesPublicRootRender,
    propertyMutation: record.propertyMutation,
    publicDomMutation: record.publicDomMutation,
    publicMountStatus: record.publicMountStatus,
    publicPortalMounting: record.publicPortalMounting,
    publicRootCompatibilitySurface: record.publicRootCompatibilitySurface,
    publicRootRenderCompatibilityClaimed:
      record.publicRootRenderCompatibilityClaimed,
    reconcilerExecution: record.reconcilerExecution,
    reconciliationStatus: record.reconciliationStatus,
    rootId: record.rootId,
    singleHostComponentUpdate: record.singleHostComponentUpdate,
    sourceBoundaryId: record.sourceBoundaryId,
    sourceMountDiagnosticId: record.sourceMountDiagnosticId,
    textMutation: record.textMutation
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

function summarizePrivateRootPortalDiagnosticSideEffects({
  document,
  listenerRegistry,
  portalContainer,
  rootContainer,
  rootMarkers,
  sideEffectCleanup
}) {
  return {
    compatibilityClaimed: false,
    fakeDomPortalMutationObserved: portalContainer.__mutationLog.length > 0,
    ownerDocumentListenerRegistrationCount: document.__registrations.length,
    ownerDocumentListeningMarkerPropertyCount:
      listenerRegistry.inspectListeningMarker(document).propertyCount,
    ownerDocumentMutationCount: document.__mutationLog.length,
    portalContainerListenerRegistrationCount:
      portalContainer.__registrations.length,
    portalContainerListeningMarkerPropertyCount:
      listenerRegistry.inspectListeningMarker(portalContainer).propertyCount,
    portalContainerMutationCount: portalContainer.__mutationLog.length,
    privatePortalMetadataPromotesPublicRootRender: false,
    publicDomMutationObserved: false,
    publicPortalMountingObserved: false,
    publicRootCompatibilityClaimed: false,
    publicRootCompatibilitySurface: false,
    publicRootRenderCompatibilityClaimed: false,
    rootContainerListenerRegistrationCount:
      rootContainer.__registrations.length,
    rootContainerListeningMarkerPropertyCount:
      listenerRegistry.inspectListeningMarker(rootContainer).propertyCount,
    rootContainerMarkerPropertyCount:
      rootMarkers.inspectContainerRootMarker(rootContainer).propertyCount,
    rootContainerMutationCount: rootContainer.__mutationLog.length,
    sideEffectCleanupStatus: sideEffectCleanup.sideEffectStatus
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

function inspectSyncFlushCrossRootReconcilerDiagnostics({ workspaceRoot }) {
  try {
    const syncFlushSource = readWorkspaceFile(
      workspaceRoot,
      "crates/fast-react-reconciler/src/sync_flush.rs"
    );

    return {
      loadError: null,
      commitWorkOnAllRootsPathPresent:
        /flush_sync_commit_work_on_all_roots/u.test(syncFlushSource) &&
        /flush_sync_work_across_scheduled_roots/u.test(syncFlushSource),
      crossRootDiagnosticMethodPresent:
        /cross_root_render_diagnostics_for_canary/u.test(syncFlushSource),
      crossRootDiagnosticStructPresent:
        /SyncFlushCrossRootRenderDiagnosticsForCanary/u.test(syncFlushSource),
      crossRootDiagnosticTestPresent:
        /sync_flush_cross_root_render_diagnostics_prove_scheduled_private_flush/u.test(
          syncFlushSource
        ),
      scheduledRootTraversalPresent:
        /first_scheduled_root/u.test(syncFlushSource) &&
        /next_scheduled_root/u.test(syncFlushSource),
      syncLaneConsumptionCheckPresent:
        /sync_lanes_consumed_from_roots/u.test(syncFlushSource) &&
        /proves_cross_root_sync_flush_scheduling/u.test(syncFlushSource)
    };
  } catch (error) {
    return {
      loadError: serializeGateError(error)
    };
  }
}

function inspectActPassiveSourceDiagnostics({ workspaceRoot }) {
  try {
    const reactActGateSource = readWorkspaceFile(
      workspaceRoot,
      "packages/react/private-act-dispatcher-gate.js"
    );
    const reactDomTestUtilsActGateSource = readWorkspaceFile(
      workspaceRoot,
      "packages/react-dom/src/test-utils-act-gate.js"
    );
    const passiveEffectsSource = readWorkspaceFile(
      workspaceRoot,
      "crates/fast-react-reconciler/src/passive_effects.rs"
    );
    const rootSchedulerSource = readWorkspaceFile(
      workspaceRoot,
      "crates/fast-react-reconciler/src/root_scheduler.rs"
    );

    return {
      loadError: null,
      reactActRendererBackedDrainDiagnosticPresent:
        /private-renderer-backed-act-drain-diagnostic/u.test(
          reactActGateSource
        ) &&
        /consumeRendererBackedActDrainDiagnostics/u.test(reactActGateSource),
      reactDomTestUtilsActPrivateRoutingGatePresent:
        /react-dom-test-utils-act-private-routing-gate-5/u.test(
          reactDomTestUtilsActGateSource
        ) &&
        /blocked-public-test-utils-act-private-routing/u.test(
          reactDomTestUtilsActGateSource
        ),
      reactDomTestUtilsPublicActBlockedPresent:
        /public-react-act-delegation/u.test(reactDomTestUtilsActGateSource) &&
        /public-react-dom-root-execution/u.test(
          reactDomTestUtilsActGateSource
        ),
      passiveCallbackInvocationGatePresent:
        /PassiveEffectCallbackInvocationGateSnapshot/u.test(
          passiveEffectsSource
        ) &&
        /invoke_passive_effect_callbacks_under_test_control/u.test(
          passiveEffectsSource
        ),
      passiveDestroyExecutorPresent:
        /flush_passive_effects_after_commit_with_destroy_executor/u.test(
          passiveEffectsSource
        ),
      passiveErrorCaptureRecordPresent:
        /PassiveEffectRootErrorCaptureRecord/u.test(passiveEffectsSource),
      passiveSchedulerFlushGatePresent:
        /passive_effect_scheduler_flush_gate/u.test(rootSchedulerSource) &&
        /root_scheduler_passive_effect_scheduler_flush_gate_records_request_without_consuming/u.test(
          rootSchedulerSource
        )
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
    },
    removeEventListener(type, listener, options) {
      const index = this.__registrations.findIndex(
        (entry) =>
          entry.type === type &&
          entry.listener === listener &&
          entry.options === options
      );
      if (index !== -1) {
        this.__registrations.splice(index, 1);
      }
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

function createPrivateHostOutputDocument({ domContainer, label }) {
  return new PrivateHostOutputDocument({
    documentNodeType: domContainer.DOCUMENT_NODE,
    elementNodeType: domContainer.ELEMENT_NODE,
    label,
    textNodeType: domContainer.TEXT_NODE
  });
}

class PrivateHostOutputNode {
  constructor({ nodeName, nodeType, ownerDocument }) {
    this.__mutationLog = [];
    this.__registrations = [];
    this.childNodes = [];
    this.mutationLog = [];
    this.nodeName = nodeName;
    this.nodeType = nodeType;
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
  }

  get firstChild() {
    return this.childNodes[0] ?? null;
  }

  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] ?? null;
  }

  get textContent() {
    return this.childNodes.map((child) => child.textContent).join("");
  }

  set textContent(value) {
    for (const child of [...this.childNodes]) {
      detachPrivateHostOutputChild(child);
    }
    const text = String(value);
    this.__mutationLog.push({ type: "textContent", value: text });
    this.mutationLog.push(["textContent", text]);
  }

  addEventListener(type, listener, options) {
    this.__registrations.push({
      listener,
      options,
      type
    });
  }

  removeEventListener(type, listener, options) {
    const index = this.__registrations.findIndex(
      (entry) =>
        entry.type === type &&
        entry.listener === listener &&
        entry.options === options
    );
    if (index !== -1) {
      this.__registrations.splice(index, 1);
    }
  }

  appendChild(child) {
    assertPrivateHostOutputChild(child);
    assertPrivateHostOutputCanAcceptChild(this, child);
    detachPrivateHostOutputChild(child);
    this.childNodes.push(child);
    child.parentNode = this;
    this.__mutationLog.push({ child: child.nodeName, type: "appendChild" });
    this.mutationLog.push(["appendChild", child.nodeName]);
    return child;
  }

  insertBefore(child, beforeChild) {
    assertPrivateHostOutputChild(child);
    assertPrivateHostOutputCanAcceptChild(this, child);
    if (beforeChild?.parentNode !== this) {
      throw new Error("Private host-output insert target is not a child.");
    }
    if (child === beforeChild) {
      return child;
    }

    detachPrivateHostOutputChild(child);
    const index = this.childNodes.indexOf(beforeChild);
    this.childNodes.splice(index, 0, child);
    child.parentNode = this;
    this.__mutationLog.push({
      beforeChild: beforeChild.nodeName,
      child: child.nodeName,
      type: "insertBefore"
    });
    this.mutationLog.push(["insertBefore", child.nodeName, beforeChild.nodeName]);
    return child;
  }

  removeChild(child) {
    if (child?.parentNode !== this) {
      throw new Error("Private host-output remove target is not a child.");
    }

    detachPrivateHostOutputChild(child);
    this.__mutationLog.push({ child: child.nodeName, type: "removeChild" });
    this.mutationLog.push(["removeChild", child.nodeName]);
    return child;
  }
}

class PrivateHostOutputDocument extends PrivateHostOutputNode {
  constructor({ documentNodeType, elementNodeType, label, textNodeType }) {
    super({
      nodeName: "#document",
      nodeType: documentNodeType,
      ownerDocument: null
    });
    this.defaultView = new PrivateHostOutputNode({
      nodeName: `${label}:window`,
      nodeType: 0,
      ownerDocument: this
    });
    this.elementNodeType = elementNodeType;
    this.ownerDocument = this;
    this.textNodeType = textNodeType;
  }

  createElement(nodeName) {
    return new PrivateHostOutputElement({
      nodeName: String(nodeName).toUpperCase(),
      nodeType: this.elementNodeType,
      ownerDocument: this
    });
  }

  createTextNode(text) {
    return new PrivateHostOutputText({
      nodeType: this.textNodeType,
      ownerDocument: this,
      text
    });
  }
}

class PrivateHostOutputElement extends PrivateHostOutputNode {
  constructor(fields) {
    super(fields);
    this.attributes = new Map();
    this.attributeLog = [];
    this._className = "";
    this._id = "";
    this._title = "";
  }

  get className() {
    return this._className;
  }

  set className(value) {
    this._className = String(value);
    this.setAttribute("class", this._className);
  }

  get id() {
    return this._id;
  }

  set id(value) {
    this._id = String(value);
    this.setAttribute("id", this._id);
  }

  get title() {
    return this._title;
  }

  set title(value) {
    this._title = String(value);
    this.setAttribute("title", this._title);
  }

  setAttribute(name, value) {
    const attributeName = String(name);
    const stringValue = String(value);
    this.attributeLog.push(["setAttribute", attributeName, stringValue]);
    this.attributes.set(attributeName, stringValue);
  }

  removeAttribute(name) {
    const attributeName = String(name);
    this.attributeLog.push([
      "removeAttribute",
      attributeName,
      this.attributes.has(attributeName)
    ]);
    this.attributes.delete(attributeName);
  }

  getAttribute(name) {
    const attributeName = String(name);
    return this.attributes.has(attributeName)
      ? this.attributes.get(attributeName)
      : null;
  }
}

class PrivateHostOutputText extends PrivateHostOutputNode {
  constructor({ nodeType, ownerDocument, text }) {
    super({
      nodeName: "#text",
      nodeType,
      ownerDocument
    });
    this._data = String(text);
    this.writeLog = [];
  }

  get data() {
    return this._data;
  }

  set data(value) {
    const text = String(value);
    this.writeLog.push(["data", text]);
    this._data = text;
  }

  get nodeValue() {
    return this._data;
  }

  set nodeValue(value) {
    const text = String(value);
    this.writeLog.push(["nodeValue", text]);
    this._data = text;
  }

  get textContent() {
    return this._data;
  }

  set textContent(value) {
    const text = String(value);
    this.writeLog.push(["textContent", text]);
    this._data = text;
  }
}

function assertPrivateHostOutputChild(child) {
  if (child == null || typeof child !== "object") {
    throw new Error("Private host-output child must be a node.");
  }
}

function assertPrivateHostOutputCanAcceptChild(parent, child) {
  let current = parent;
  while (current !== null) {
    if (current === child) {
      throw new Error("Private host-output cannot insert an ancestor.");
    }
    current = current.parentNode;
  }
}

function detachPrivateHostOutputChild(child) {
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

function isAcceptedPrivateRootPortalBoundary(boundary) {
  const blockedCapabilityIds = boundary?.blockedCapabilities?.map(
    (capability) => capability.id
  );
  const allBlockedCapabilitiesAreBlocked = boundary?.blockedCapabilities?.every(
    (capability) => capability.blocked === true
  );

  return (
    boundary?.kind === "FastReactDomPrivateRootPortalBoundaryRecord" &&
    boundary.operation === "portal-root-boundary" &&
    boundary.boundaryId === "portal-boundary:1" &&
    boundary.boundarySequence === 1 &&
    boundary.boundaryStatus ===
      "admitted-private-root-portal-boundary-record" &&
    boundary.diagnosticStatus === "blocked-private-root-portal-diagnostic" &&
    boundary.sourceOperation === "render" &&
    boundary.sourceRequestId === "portal-request:2" &&
    boundary.sourceRequestSequence === 2 &&
    boundary.sourceRequestType === "root.render" &&
    boundary.sourceUpdateId === "portal-update:1" &&
    boundary.sourceLifecycleStatusBefore === "created" &&
    boundary.sourceLifecycleStatusAfter === "rendered" &&
    boundary.rootId === "portal-root:1" &&
    boundary.rootKind === "client" &&
    boundary.rootTag === "ConcurrentRoot" &&
    boundary.portalKey === "portal-key" &&
    findFirstDifferencePath(blockedCapabilityIds, [
      "portal-child-reconciliation",
      "portal-container-mounting",
      "portal-container-listeners",
      "native-execution",
      "reconciler-execution",
      "dom-mutation",
      "marker-writes",
      "listener-installation",
      "hydration",
      "events",
      "compatibility-claims"
    ]) === null &&
    allBlockedCapabilitiesAreBlocked === true &&
    boundary.acceptedPortalObjectShape === true &&
    boundary.nativeExecution === false &&
    boundary.reconcilerExecution === false &&
    boundary.portalChildReconciliation === false &&
    boundary.portalMounting === false &&
    boundary.publicPortalMounting === false &&
    boundary.publicRootCompatibilitySurface === false &&
    boundary.publicRootRenderCompatibilityClaimed === false &&
    boundary.domMutation === false &&
    boundary.publicDomMutation === false &&
    boundary.markerWrites === false &&
    boundary.listenerInstallation === false &&
    boundary.hydration === false &&
    boundary.eventDispatch === false &&
    boundary.privatePortalMetadataPromotesPublicRootRender === false &&
    boundary.compatibilityClaimed === false &&
    boundary.portalObjectInfo?.type === "object" &&
    findFirstDifferencePath(boundary.portalObjectInfo.keys, [
      "$$typeof",
      "children",
      "containerInfo",
      "implementation",
      "key"
    ]) === null &&
    boundary.portalChildrenInfo?.type === "object" &&
    findFirstDifferencePath(boundary.portalChildrenInfo.keys, [
      "props",
      "type"
    ]) === null &&
    boundary.portalContainerInfo?.nodeName === "SECTION" &&
    boundary.portalContainerInfo?.nodeType === 1 &&
    boundary.portalImplementationInfo?.type === "null" &&
    boundary.portalListenerGuard?.action ===
      "defer-listen-to-portal-container-events-for-root-boundary" &&
    boundary.portalListenerGuard.canInstallPortalListeners === true &&
    boundary.portalListenerGuard.hasPortalListeningMarker === false &&
    boundary.portalListenerGuard.ownerDocumentCanInstallSelectionChange ===
      true &&
    boundary.portalListenerGuard.ownerDocumentHasSelectionChangeMarker ===
      false &&
    boundary.reconcilerDiagnostic?.beginWorkRecord ===
      "UnsupportedPortalBeginWorkRecord" &&
    boundary.reconcilerDiagnostic?.failClosedBeforeChildren === true &&
    boundary.reconcilerDiagnostic?.rootPreflightError ===
      "HostRootChildBeginWorkPreflightError::UnsupportedPortal" &&
    boundary.reconcilerDiagnostic?.unsupportedFeature ===
      "PORTAL_RECONCILER_UNSUPPORTED_FEATURE"
  );
}

function isAcceptedPrivateRootBridgePortalDiagnostics(diagnostics) {
  if (diagnostics?.status !== "ok") {
    return false;
  }

  const prepare = diagnostics.prepareMountListenerIntent;
  const mount = diagnostics.fakeDomMount;
  const eventOwner = diagnostics.eventOwnerRootGate;
  const child = diagnostics.childReconciliation;
  const sideEffects = diagnostics.sideEffects;

  return (
    prepare?.kind ===
      "FastReactDomPrivateRootPortalPrepareMountListenerIntentRecord" &&
    prepare.intentStatus ===
      "admitted-private-root-portal-prepare-mount-listener-intent" &&
    prepare.listenerInstallationStatus ===
      "blocked-private-root-portal-listener-installation" &&
    prepare.preparePortalMountIntent === true &&
    prepare.preparePortalMount === false &&
    prepare.domMutation === false &&
    privatePortalRecordDoesNotPromotePublicRootRender(prepare) &&
    mount?.kind ===
      "FastReactDomPrivateRootPortalFakeDomMountDiagnosticRecord" &&
    mount.mountStatus === "applied-private-root-portal-fake-dom-mount-diagnostic" &&
    mount.publicMountStatus === "blocked-public-root-portal-mounting" &&
    mount.fakeDomCommitApplied === true &&
    mount.fakeDomPortalMountDiagnostic === true &&
    mount.componentTreeMetadataAttached === true &&
    mount.portalChildReconciliation === false &&
    mount.portalContainerChildrenReplaced === false &&
    mount.portalMounting === false &&
    mount.domMutation === true &&
    privatePortalRecordDoesNotPromotePublicRootRender(mount) &&
    eventOwner?.kind ===
      "FastReactDomPrivateRootPortalEventOwnerRootGateRecord" &&
    eventOwner.gateStatus ===
      "recorded-private-root-portal-event-owner-root-gate" &&
    eventOwner.eventBubblingStatus ===
      "blocked-private-root-portal-event-bubbling" &&
    eventOwner.portalOwnerRootAttached === true &&
    eventOwner.portalEventPathDiagnostic === true &&
    eventOwner.portalEventBubbling === false &&
    eventOwner.publicPortalBubbling === false &&
    eventOwner.browserDomEventCompatibilityClaimed === false &&
    eventOwner.fakeDomEventCompatibilityClaimed === false &&
    eventOwner.syntheticEventCount === 0 &&
    eventOwner.domMutation === false &&
    privatePortalRecordDoesNotPromotePublicRootRender(eventOwner) &&
    child?.kind ===
      "FastReactDomPrivateRootPortalChildReconciliationDiagnosticRecord" &&
    child.reconciliationStatus ===
      "admitted-private-root-portal-child-reconciliation-diagnostic" &&
    child.publicMountStatus === "blocked-public-root-portal-mounting" &&
    child.fakeDomCommitApplied === true &&
    child.fakeDomPortalMountDiagnostic === true &&
    child.portalChildReconciliation === true &&
    child.singleHostComponentUpdate === true &&
    child.portalHostComponentUpdated === true &&
    child.portalHostTextUpdated === true &&
    child.latestPropsPublished === true &&
    child.latestPropsPublishOrder ===
      "after-portal-property-and-text-mutation" &&
    child.domMutation === true &&
    privatePortalRecordDoesNotPromotePublicRootRender(child) &&
    diagnostics.payloadsHidden?.prepareBoundaryMatches === true &&
    diagnostics.payloadsHidden.preparePortalContainerMatches === true &&
    diagnostics.payloadsHidden.mountCommitMatches === true &&
    diagnostics.payloadsHidden.mountPortalContainerMatches === true &&
    diagnostics.payloadsHidden.eventMountMatches === true &&
    diagnostics.payloadsHidden.childMountMatches === true &&
    diagnostics.payloadsHidden.childBoundaryMatches === true &&
    diagnostics.payloadsHidden.childNextChildMatches === true &&
    sideEffects?.privatePortalMetadataPromotesPublicRootRender === false &&
    sideEffects.publicRootCompatibilitySurface === false &&
    sideEffects.publicRootRenderCompatibilityClaimed === false &&
    sideEffects.publicRootCompatibilityClaimed === false &&
    sideEffects.publicPortalMountingObserved === false &&
    sideEffects.publicDomMutationObserved === false &&
    sideEffects.fakeDomPortalMutationObserved === true &&
    sideEffects.rootContainerMutationCount === 0 &&
    sideEffects.rootContainerMarkerPropertyCount === 0 &&
    sideEffects.rootContainerListenerRegistrationCount === 0 &&
    sideEffects.rootContainerListeningMarkerPropertyCount === 0 &&
    sideEffects.portalContainerListenerRegistrationCount === 0 &&
    sideEffects.portalContainerListeningMarkerPropertyCount === 0 &&
    sideEffects.ownerDocumentListenerRegistrationCount === 0 &&
    sideEffects.ownerDocumentListeningMarkerPropertyCount === 0 &&
    sideEffects.sideEffectCleanupStatus ===
      "reverted-private-root-create-mark-listen-gate"
  );
}

function privatePortalRecordDoesNotPromotePublicRootRender(record) {
  return (
    record.compatibilityClaimed === false &&
    record.eventDispatch === false &&
    record.listenerInstallation === false &&
    record.privatePortalMetadataPromotesPublicRootRender === false &&
    record.publicDomMutation === false &&
    record.publicPortalMounting === false &&
    record.publicRootCompatibilitySurface === false &&
    record.publicRootRenderCompatibilityClaimed === false &&
    record.reconcilerExecution === false
  );
}

function isAcceptedPrivateRootPortalBoundaryPayload(payload) {
  return (
    payload?.portalChildrenMatches === true &&
    payload.portalContainerMatches === true &&
    payload.portalMatches === true &&
    payload.rootHandleMatches === true &&
    payload.sourceRecordMatches === true
  );
}

function isAcceptedPrivateRootPortalRequest(request) {
  return (
    request?.render?.kind === "FastReactDomPrivateRootUpdateRecord" &&
    request.render.operation === "render" &&
    request.render.requestType === "root.render" &&
    request.render.updateId === "portal-update:1" &&
    request.render.lifecycleStatusBefore === "created" &&
    request.render.lifecycleStatusAfter === "rendered" &&
    request.render.renderCount === 1 &&
    request.render.nativeExecution === false &&
    request.render.markerGuard === null &&
    request.admission?.kind === "FastReactDomPrivateRootAdmissionRecord" &&
    request.admission.operation === "render" &&
    request.admission.requestType === "root.render" &&
    request.admission.admissionStatus ===
      "admitted-private-root-bridge-request-record" &&
    request.admission.executionStatus ===
      "blocked-private-root-bridge-execution" &&
    request.admission.compatibilityStatus ===
      "blocked-private-root-bridge-compatibility" &&
    request.admission.nativeExecution === false &&
    request.admission.reconcilerExecution === false &&
    request.admission.domMutation === false &&
    request.admission.listenerInstallation === false &&
    request.admission.eventDispatch === false &&
    request.admission.compatibilityClaimed === false
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

function validatePrivateCrossRootSchedulingDiagnosticObservation({
  observation,
  scenarioId
}) {
  if (observation.status !== "ok") {
    return {
      gateStatus: "private-cross-root-scheduling-diagnostic-failed",
      status: observation.status,
      error: observation.error ?? null
    };
  }

  if (scenarioId !== "flush-sync-cross-root-render") {
    return {
      gateStatus: "private-cross-root-scheduling-unexpected-scenario"
    };
  }

  const evidence = observation.evidence;
  const commonDifference = findFirstDifferencePath(
    {
      compatibilityClaimed: false,
      comparedToReactDomOracle: false,
      diagnosticKind: "private-cross-root-scheduling-flush",
      publicFlushSyncCompatibilityClaimed: false,
      publicRootCompatibilitySurface: false,
      requestOperations: ["create", "create", "render", "render"],
      requestRecordCount: 4,
      thrownOperations: []
    },
    {
      compatibilityClaimed: evidence.compatibilityClaimed,
      comparedToReactDomOracle: evidence.comparedToReactDomOracle,
      diagnosticKind: evidence.diagnosticKind,
      publicFlushSyncCompatibilityClaimed:
        evidence.publicFlushSyncCompatibilityClaimed,
      publicRootCompatibilitySurface: evidence.publicRootCompatibilitySurface,
      requestOperations: evidence.rootBridgeEvidence?.requestOperations,
      requestRecordCount: evidence.rootBridgeEvidence?.requestRecordCount,
      thrownOperations: evidence.rootBridgeEvidence?.thrownOperations
    }
  );
  if (commonDifference !== null) {
    return {
      gateStatus: "private-cross-root-scheduling-common-evidence-mismatch",
      firstDifferencePath: commonDifference
    };
  }

  if (
    evidence.rootBridgeEvidence.admissions.some(
      (admission) =>
        admission.admissionStatus !==
          "admitted-private-root-bridge-request-record" ||
        admission.executionStatus !==
          "blocked-private-root-bridge-execution" ||
        admission.compatibilityClaimed !== false
    ) ||
    evidence.rootBridgeEvidence.nativeHandoffs.some(
      (handoff) =>
        handoff.handoffStatus !==
          "mirrored-private-native-root-request-record" ||
        handoff.nativeExecution !== false ||
        handoff.reconcilerExecution !== false ||
        handoff.domMutation !== false ||
        handoff.markerWrites !== false ||
        handoff.listenerInstallation !== false ||
        handoff.compatibilityClaimed !== false
    )
  ) {
    return {
      gateStatus:
        "private-cross-root-scheduling-root-bridge-evidence-mismatch"
    };
  }

  const schedulingDifference = findFirstDifferencePath(
    expectedPrivateCrossRootSchedulingEvidence(),
    comparablePrivateCrossRootSchedulingDiagnosticEvidence(evidence)
  );
  if (schedulingDifference !== null) {
    return {
      gateStatus: "private-cross-root-scheduling-evidence-mismatch",
      firstDifferencePath: schedulingDifference
    };
  }

  return null;
}

function validatePrivateActPassiveDiagnosticObservation({ observation }) {
  if (observation.status !== "ok") {
    return {
      gateStatus: "private-root-act-passive-diagnostic-failed",
      status: observation.status,
      error: observation.error ?? null
    };
  }

  const evidence = observation.evidence;
  const commonDifference = findFirstDifferencePath(
    {
      compatibilityClaimed: false,
      comparedToReactDomOracle: false,
      diagnosticKind: "private-root-render-act-passive-diagnostic",
      publicPassiveEffectCompatibilityClaimed: false,
      publicReactActCompatibilityClaimed: false,
      publicReactDomTestUtilsActCompatibilityClaimed: false,
      publicRootCompatibilitySurface: false,
      publicRootRenderCompatibilityClaimed: false
    },
    {
      compatibilityClaimed: evidence.compatibilityClaimed,
      comparedToReactDomOracle: evidence.comparedToReactDomOracle,
      diagnosticKind: evidence.diagnosticKind,
      publicPassiveEffectCompatibilityClaimed:
        evidence.publicPassiveEffectCompatibilityClaimed,
      publicReactActCompatibilityClaimed:
        evidence.publicReactActCompatibilityClaimed,
      publicReactDomTestUtilsActCompatibilityClaimed:
        evidence.publicReactDomTestUtilsActCompatibilityClaimed,
      publicRootCompatibilitySurface: evidence.publicRootCompatibilitySurface,
      publicRootRenderCompatibilityClaimed:
        evidence.publicRootRenderCompatibilityClaimed
    }
  );
  if (commonDifference !== null) {
    return {
      gateStatus: "private-root-act-passive-common-evidence-mismatch",
      firstDifferencePath: commonDifference
    };
  }

  const actDifference = findFirstDifferencePath(
    expectedPrivateActEvidence(),
    comparablePrivateActEvidence(evidence.actEvidence)
  );
  if (actDifference !== null) {
    return {
      gateStatus: "private-root-act-passive-act-evidence-mismatch",
      firstDifferencePath: actDifference
    };
  }

  const passiveDifference = findFirstDifferencePath(
    expectedPrivatePassiveEvidence(),
    comparablePrivatePassiveEvidence(evidence.passiveEvidence)
  );
  if (passiveDifference !== null) {
    return {
      gateStatus: "private-root-act-passive-passive-evidence-mismatch",
      firstDifferencePath: passiveDifference
    };
  }

  const sourceDifference = findFirstDifferencePath(
    expectedActPassiveSourceDiagnostics(),
    comparableActPassiveSourceDiagnostics(evidence.sourceDiagnostics)
  );
  if (sourceDifference !== null) {
    return {
      gateStatus: "private-root-act-passive-source-diagnostic-mismatch",
      firstDifferencePath: sourceDifference
    };
  }

  return null;
}

function validatePrivateWarningBoundaryDiagnosticObservation({
  mode,
  observation,
  scenarioId
}) {
  if (observation.status !== "ok") {
    return {
      gateStatus: "private-root-warning-boundary-diagnostic-failed",
      status: observation.status,
      error: observation.error ?? null
    };
  }

  if (scenarioId !== "development-warning-boundaries") {
    return {
      gateStatus: "private-root-warning-boundary-unexpected-scenario"
    };
  }

  const modeWarningEnabled = mode.nodeEnv !== "production";
  const evidence = observation.evidence;
  const commonDifference = findFirstDifferencePath(
    {
      compatibilityClaimed: false,
      comparedToReactDomOracle: false,
      consoleOutputCaptured: false,
      consoleOutputUsedAsEvidence: false,
      diagnosticKind: "private-root-warning-boundary",
      modeWarningEnabled,
      publicRootCompatibilitySurface: false,
      warningBoundaryConsoleEvidence: false,
      warningBoundaryPublicSurface: false
    },
    {
      compatibilityClaimed: evidence.compatibilityClaimed,
      comparedToReactDomOracle: evidence.comparedToReactDomOracle,
      consoleOutputCaptured: evidence.consoleOutputCaptured,
      consoleOutputUsedAsEvidence: evidence.consoleOutputUsedAsEvidence,
      diagnosticKind: evidence.diagnosticKind,
      modeWarningEnabled: evidence.modeWarningEnabled,
      publicRootCompatibilitySurface: evidence.publicRootCompatibilitySurface,
      warningBoundaryConsoleEvidence:
        evidence.warningBoundaryEvidence?.consoleOutputUsedAsEvidence,
      warningBoundaryPublicSurface:
        evidence.warningBoundaryEvidence?.publicRootCompatibilitySurface
    }
  );
  if (commonDifference !== null) {
    return {
      gateStatus: "private-root-warning-boundary-common-evidence-mismatch",
      firstDifferencePath: commonDifference
    };
  }

  const boundaries = evidence.warningBoundaryEvidence?.boundaries ?? [];
  const boundaryIds = boundaries.map((boundary) => boundary.boundaryId);
  const boundaryIdDifference = findFirstDifferencePath(
    [
      "root-render-callback-second-argument",
      "root-render-container-second-argument",
      "root-render-generic-second-argument",
      "root-unmount-callback-argument",
      "duplicate-create-root"
    ],
    boundaryIds
  );
  if (boundaryIdDifference !== null) {
    return {
      gateStatus: "private-root-warning-boundary-id-mismatch",
      firstDifferencePath: boundaryIdDifference
    };
  }

  for (const boundary of boundaries) {
    if (
      boundary.consoleOutputUsedAsEvidence !== false ||
      boundary.modeWarningEnabled !== modeWarningEnabled ||
      boundary.publicRootCompatibilitySurface !== false ||
      boundary.warningEmission !==
        (modeWarningEnabled
          ? "development-warning-boundary"
          : "production-warning-disabled")
    ) {
      return {
        gateStatus: "private-root-warning-boundary-row-mismatch",
        boundary
      };
    }

    if (boundary.boundaryId === "duplicate-create-root") {
      const expectedWarningType = modeWarningEnabled
        ? "duplicate-create-root"
        : null;
      if (
        boundary.argumentClassification?.isValidContainer !== true ||
        boundary.argumentClassification
          ?.isContainerMarkedAsRootBeforeSecondCreate !== true ||
        boundary.duplicateWarningType !== expectedWarningType ||
        boundary.firstCreateMarkerWarning !== null ||
        (boundary.secondCreateMarkerWarning?.type ?? null) !==
          expectedWarningType ||
        boundary.privateEvidenceKind !== "private-root-create-markerGuard" ||
        boundary.record?.requestType !== "createRoot" ||
        boundary.record?.nativeExecution !== false ||
        boundary.record?.reconcilerExecution !== false ||
        boundary.record?.domMutation !== false ||
        boundary.record?.compatibilityClaimed !== false ||
        boundary.rootSideEffects?.sideEffect?.sideEffectStatus !==
          "applied-private-root-create-mark-listen-gate" ||
        boundary.rootSideEffects?.cleanup?.sideEffectStatus !==
          "reverted-private-root-create-mark-listen-gate" ||
        !isRootFacadeSideEffectFree(boundary.rootSideEffects?.afterCleanup)
      ) {
        return {
          gateStatus: "private-root-duplicate-warning-boundary-mismatch",
          boundary
        };
      }
      continue;
    }

    const expected = expectedPrivateWarningArgumentBoundary(
      boundary.boundaryId
    );
    if (expected === null) {
      return {
        gateStatus: "private-root-warning-boundary-unknown-id",
        boundaryId: boundary.boundaryId
      };
    }

    const boundaryDifference = findFirstDifferencePath(expected, {
      argumentClassification: boundary.argumentClassification,
      callbackInfo: boundary.callbackInfo,
      privateEvidenceKind: boundary.privateEvidenceKind,
      record: boundary.record
    });
    if (boundaryDifference !== null) {
      return {
        gateStatus: "private-root-warning-boundary-argument-mismatch",
        boundaryId: boundary.boundaryId,
        firstDifferencePath: boundaryDifference
      };
    }
  }

  return null;
}

function expectedPrivateWarningArgumentBoundary(boundaryId) {
  switch (boundaryId) {
    case "root-render-callback-second-argument":
      return {
        argumentClassification: {
          isValidContainer: false,
          type: "function"
        },
        callbackInfo: {
          length: 0,
          name: "afterRender",
          type: "function"
        },
        privateEvidenceKind: "private-root-update-callbackInfo",
        record: expectedPrivateWarningUpdateBoundaryRecord(
          "render",
          "root.render"
        )
      };
    case "root-render-container-second-argument":
      return {
        argumentClassification: {
          isValidContainer: true,
          nodeType: 1,
          type: "object"
        },
        callbackInfo: {
          keys: [
            "__mutationLog",
            "__registrations",
            "addEventListener",
            "appendChild",
            "insertBefore",
            "nodeName",
            "nodeType",
            "ownerDocument",
            "removeChild",
            "removeEventListener",
            "textContent"
          ],
          type: "object"
        },
        privateEvidenceKind: "private-root-update-callbackInfo",
        record: expectedPrivateWarningUpdateBoundaryRecord(
          "render",
          "root.render"
        )
      };
    case "root-render-generic-second-argument":
      return {
        argumentClassification: {
          isValidContainer: false,
          type: "object"
        },
        callbackInfo: {
          keys: ["unexpected"],
          type: "object"
        },
        privateEvidenceKind: "private-root-update-callbackInfo",
        record: expectedPrivateWarningUpdateBoundaryRecord(
          "render",
          "root.render"
        )
      };
    case "root-unmount-callback-argument":
      return {
        argumentClassification: {
          isValidContainer: false,
          type: "function"
        },
        callbackInfo: {
          length: 0,
          name: "afterUnmount",
          type: "function"
        },
        privateEvidenceKind: "private-root-update-callbackInfo",
        record: expectedPrivateWarningUpdateBoundaryRecord(
          "unmount",
          "root.unmount"
        )
      };
    default:
      return null;
  }
}

function expectedPrivateWarningUpdateBoundaryRecord(operation, requestType) {
  return {
    compatibilityClaimed: false,
    domMutation: false,
    eventDispatch: false,
    hydration: false,
    listenerInstallation: false,
    markerWrites: false,
    nativeExecution: false,
    operation,
    reconcilerExecution: false,
    requestType
  };
}

function validatePrivateHostOutputDiagnosticObservation({
  observation,
  scenarioId
}) {
  if (observation.status !== "ok") {
    return {
      gateStatus: "private-root-host-output-diagnostic-failed",
      status: observation.status,
      error: observation.error ?? null
    };
  }

  const evidence = observation.evidence;
  const commonExpectation = {
    compatibilityClaimed: false,
    comparedToReactDomOracle: false,
    diagnosticKind: "private-fake-dom-root-host-output",
    publicRootCompatibilitySurface: false,
    requestOperations: expectedPrivateHostOutputRequestOperations(scenarioId),
    thrownOperations: expectedPrivateHostOutputThrownOperations(scenarioId),
    rootSideEffects: {
      afterApply: {
        containerListenerRegistrationCount: 138,
        containerListeningMarkerPropertyCount: 1,
        containerMarkerPropertyCount: 1,
        containerMarkerTruthyCount: 1,
        ownerDocumentListenerRegistrationCount: 1,
        ownerDocumentListeningMarkerPropertyCount: 1
      },
      afterCleanup: {
        containerListenerRegistrationCount: 0,
        containerListeningMarkerPropertyCount: 0,
        containerMarkerPropertyCount: 0,
        containerMarkerTruthyCount: 0,
        ownerDocumentListenerRegistrationCount: 0,
        ownerDocumentListeningMarkerPropertyCount: 0
      },
      before: {
        containerListenerRegistrationCount: 0,
        containerListeningMarkerPropertyCount: 0,
        containerMarkerPropertyCount: 0,
        containerMarkerTruthyCount: 0,
        ownerDocumentListenerRegistrationCount: 0,
        ownerDocumentListeningMarkerPropertyCount: 0
      },
      cleanupStatus: "reverted-private-root-create-mark-listen-gate",
      sideEffectStatus: "applied-private-root-create-mark-listen-gate"
    }
  };
  const commonActual = {
    compatibilityClaimed: evidence.compatibilityClaimed,
    comparedToReactDomOracle: evidence.comparedToReactDomOracle,
    diagnosticKind: evidence.diagnosticKind,
    publicRootCompatibilitySurface: evidence.publicRootCompatibilitySurface,
    requestOperations: evidence.rootBridgeEvidence.requestOperations,
    thrownOperations: evidence.rootBridgeEvidence.thrownOperations,
    rootSideEffects: {
      afterApply: evidence.rootSideEffectEvidence.afterApply,
      afterCleanup: evidence.rootSideEffectEvidence.cleanup.afterCleanup,
      before: evidence.rootSideEffectEvidence.before,
      cleanupStatus:
        evidence.rootSideEffectEvidence.cleanup.record.sideEffectStatus,
      sideEffectStatus: evidence.rootSideEffectEvidence.record.sideEffectStatus
    }
  };
  const commonDifference = findFirstDifferencePath(
    commonExpectation,
    commonActual
  );
  if (commonDifference !== null) {
    return {
      gateStatus: "private-root-host-output-common-evidence-mismatch",
      firstDifferencePath: commonDifference
    };
  }

  if (
    evidence.rootBridgeEvidence.admissions.some(
      (admission) =>
        admission.admissionStatus !==
          "admitted-private-root-bridge-request-record" ||
        admission.executionStatus !==
          "blocked-private-root-bridge-execution" ||
        admission.compatibilityClaimed !== false
    ) ||
    evidence.rootBridgeEvidence.nativeHandoffs.some(
      (handoff) =>
        handoff.handoffStatus !==
          "mirrored-private-native-root-request-record" ||
        handoff.nativeExecution !== false ||
        handoff.reconcilerExecution !== false ||
        handoff.domMutation !== false ||
        handoff.markerWrites !== false ||
        handoff.listenerInstallation !== false ||
        handoff.compatibilityClaimed !== false
    )
  ) {
    return {
      gateStatus: "private-root-host-output-root-bridge-evidence-mismatch"
    };
  }

  const scenarioDifference = findFirstDifferencePath(
    expectedPrivateHostOutputScenarioEvidence(scenarioId),
    comparablePrivateHostOutputScenarioEvidence(evidence.hostOutputEvidence)
  );
  if (scenarioDifference !== null) {
    return {
      gateStatus: "private-root-host-output-scenario-evidence-mismatch",
      firstDifferencePath: scenarioDifference
    };
  }

  return null;
}

function expectedPrivateHostOutputRequestOperations(scenarioId) {
  switch (scenarioId) {
    case "create-root-no-render":
      return ["create"];
    case "initial-host-render":
      return ["create", "render"];
    case "update-host-render":
      return ["create", "render", "render"];
    case "replace-host-tree":
      return ["create", "render", "render"];
    case "render-null-clears-container":
      return ["create", "render", "render"];
    case "root-unmount":
      return ["create", "render", "unmount"];
    case "double-unmount":
      return ["create", "render", "unmount", "unmount"];
    case "render-after-unmount":
      return ["create", "render", "unmount"];
    case "flush-sync-cross-root-render":
      return ["create", "create", "render", "render"];
    default:
      return [];
  }
}

function expectedPrivateHostOutputThrownOperations(scenarioId) {
  if (scenarioId !== "render-after-unmount") {
    return [];
  }

  return [
    {
      operation: "root.render",
      error: {
        code: "FAST_REACT_DOM_UNMOUNTED_ROOT",
        message: "Cannot update an unmounted root."
      }
    }
  ];
}

function expectedPrivateHostOutputScenarioEvidence(scenarioId) {
  switch (scenarioId) {
    case "create-root-no-render":
      return {
        childNodeNames: [],
        containerChildCount: 0,
        containerTextContent: "",
        hostMutationObserved: false,
        latestPropsPublished: false
      };
    case "initial-host-render":
      return {
        attributes: [
          ["class", "root-card"],
          ["data-phase", "initial"],
          ["id", "message"],
          ["title", "initial title"]
        ],
        childNodeNames: ["DIV"],
        containerChildCount: 1,
        containerTextContent: "hello",
        handoff: {
          kind: "domPropertyUpdateLatestPropsHandoff",
          latestPropsCommitRecordKind: "latestPropsCommit",
          latestPropsCommitRecordStatus: "safe-for-latest-props",
          mutationRecordCount: 5,
          payloadCount: 5,
          status: "mutated"
        },
        hostMutationObserved: true,
        latestPropsAfterCommit: createPrivateHostOutputProps("initial"),
        latestPropsBeforeCommit: {},
        latestPropsPublished: true,
        textNodeValue: "hello",
        textWriteLog: []
      };
    case "update-host-render":
      return {
        attributes: [
          ["class", "root-card updated"],
          ["data-phase", "updated"],
          ["id", "message"],
          ["title", "updated title"]
        ],
        childNodeNames: ["DIV"],
        containerChildCount: 1,
        containerTextContent: "goodbye",
        handoff: {
          kind: "domPropertyUpdateLatestPropsHandoff",
          latestPropsCommitRecordKind: "latestPropsCommit",
          latestPropsCommitRecordStatus: "safe-for-latest-props",
          mutationRecordCount: 4,
          payloadCount: 4,
          status: "mutated"
        },
        latestPropsAfterCommit: createPrivateHostOutputProps("updated"),
        latestPropsBeforeCommit: createPrivateHostOutputProps("initial"),
        latestPropsPublished: true,
        textNodeValue: "goodbye",
        textWriteLog: [["nodeValue", "goodbye"]],
        updateMutationObserved: true
      };
    case "replace-host-tree":
      return {
        initialChildNodeNames: ["SPAN"],
        initialContainerTextContent: "before",
        initialHandoff: {
          kind: "domPropertyUpdateLatestPropsHandoff",
          latestPropsCommitRecordKind: "latestPropsCommit",
          latestPropsCommitRecordStatus: "safe-for-latest-props",
          mutationRecordCount: 3,
          payloadCount: 3,
          status: "mutated"
        },
        initialLatestPropsPublished: true,
        nestedChildNodeNames: ["B"],
        nestedHandoff: {
          kind: "domPropertyUpdateLatestPropsHandoff",
          latestPropsCommitRecordKind: "latestPropsCommit",
          latestPropsCommitRecordStatus: "safe-for-latest-props",
          mutationRecordCount: 1,
          payloadCount: 1,
          status: "mutated"
        },
        nestedLatestPropsPublished: true,
        removedHostDetachedFromLatestPropsMap: true,
        replaceAttributes: [
          ["id", "replace-after"],
          ["title", "after"]
        ],
        replaceChildNodeNames: ["SECTION"],
        replaceContainerChildCount: 1,
        replaceContainerTextContent: "after",
        replacementHandoff: {
          kind: "domPropertyUpdateLatestPropsHandoff",
          latestPropsCommitRecordKind: "latestPropsCommit",
          latestPropsCommitRecordStatus: "safe-for-latest-props",
          mutationRecordCount: 3,
          payloadCount: 3,
          status: "mutated"
        },
        replacementLatestPropsPublished: true,
        replaceMutationLog: [
          ["removeChild", "SPAN"],
          ["appendChild", "SECTION"]
        ],
        textNodeValue: "after",
        textWriteLog: []
      };
    case "render-null-clears-container":
      return {
        childNodeNamesAfterRenderNull: [],
        containerChildCountAfterRenderNull: 0,
        containerTextContentAfterRenderNull: "",
        hostDetachedFromLatestPropsMap: true,
        renderNullMutationLog: [["removeChild", "DIV"]],
        renderNullMutationObserved: true,
        rootSideEffectStateAfterRenderNull: {
          containerListenerRegistrationCount: 138,
          containerListeningMarkerPropertyCount: 1,
          containerMarkerPropertyCount: 1,
          containerMarkerTruthyCount: 1,
          ownerDocumentListenerRegistrationCount: 1,
          ownerDocumentListeningMarkerPropertyCount: 1
        }
      };
    case "root-unmount":
      return {
        childNodeNamesAfterUnmount: [],
        containerChildCountAfterUnmount: 0,
        containerTextContentAfterUnmount: "",
        hostDetachedFromLatestPropsMap: true,
        unmountMutationObserved: true
      };
    case "double-unmount":
      return {
        childNodeNamesAfterSecondUnmount: [],
        childNodeNamesAfterUnmount: [],
        containerChildCountAfterSecondUnmount: 0,
        containerChildCountAfterUnmount: 0,
        containerTextContentAfterSecondUnmount: "",
        containerTextContentAfterUnmount: "",
        hostDetachedFromLatestPropsMap: true,
        secondUnmountBridgeNoOp: true,
        secondUnmountHostMutationObserved: false,
        secondUnmountMutationLog: [],
        unmountMutationObserved: true
      };
    case "render-after-unmount":
      return {
        childNodeNamesAfterRenderAttempt: [],
        childNodeNamesAfterUnmount: [],
        containerChildCountAfterRenderAttempt: 0,
        containerChildCountAfterUnmount: 0,
        containerTextContentAfterRenderAttempt: "",
        containerTextContentAfterUnmount: "",
        hostDetachedFromLatestPropsMap: true,
        renderAfterUnmountError: {
          code: "FAST_REACT_DOM_UNMOUNTED_ROOT",
          message: "Cannot update an unmounted root."
        },
        renderAfterUnmountHostMutationObserved: false,
        renderAfterUnmountMutationLog: [],
        unmountMutationObserved: true
      };
    case "flush-sync-cross-root-render":
      return {
        firstRoot: {
          attributes: [["id", "cross-a"]],
          childNodeNames: ["DIV"],
          containerChildCount: 1,
          containerTextContent: "A",
          handoff: {
            kind: "domPropertyUpdateLatestPropsHandoff",
            latestPropsCommitRecordKind: "latestPropsCommit",
            latestPropsCommitRecordStatus: "safe-for-latest-props",
            mutationRecordCount: 2,
            payloadCount: 2,
            status: "mutated"
          },
          hostMutationObserved: true,
          latestPropsAfterCommit: createPrivateHostOutputProps("cross-a"),
          latestPropsBeforeCommit: {},
          latestPropsPublished: true,
          textNodeValue: "A",
          textWriteLog: []
        },
        flushSyncEvidence: {
          callbackEvents: [
            "root.render:first",
            "root.render:second",
            "flushSyncWork"
          ],
          callbackRenderRequestCount: 2,
          callbackReturnValue: "two-root-flush-complete",
          committedRootCountAfterFlush: 2,
          flushSyncGuardWarningCount: 0,
          flushSyncWorkCallCount: 1,
          flushSyncWorkWasInRender: false,
          privateReconcilerDiagnostics:
            expectedSyncFlushCrossRootReconcilerDiagnostics(),
          publicFlushSyncCompatibilityClaimed: false,
          rootSideEffectStateAfterFlush: {
            first: {
              containerListenerRegistrationCount: 138,
              containerListeningMarkerPropertyCount: 1,
              containerMarkerPropertyCount: 1,
              containerMarkerTruthyCount: 1,
              ownerDocumentListenerRegistrationCount: 1,
              ownerDocumentListeningMarkerPropertyCount: 1
            },
            second: {
              containerListenerRegistrationCount: 138,
              containerListeningMarkerPropertyCount: 1,
              containerMarkerPropertyCount: 1,
              containerMarkerTruthyCount: 1,
              ownerDocumentListenerRegistrationCount: 1,
              ownerDocumentListeningMarkerPropertyCount: 1
            }
          }
        },
        secondRoot: {
          attributes: [["id", "cross-b"]],
          childNodeNames: ["DIV"],
          containerChildCount: 1,
          containerTextContent: "B",
          handoff: {
            kind: "domPropertyUpdateLatestPropsHandoff",
            latestPropsCommitRecordKind: "latestPropsCommit",
            latestPropsCommitRecordStatus: "safe-for-latest-props",
            mutationRecordCount: 2,
            payloadCount: 2,
            status: "mutated"
          },
          hostMutationObserved: true,
          latestPropsAfterCommit: createPrivateHostOutputProps("cross-b"),
          latestPropsBeforeCommit: {},
          latestPropsPublished: true,
          textNodeValue: "B",
          textWriteLog: []
        },
        secondRootSideEffectEvidence: {
          afterApply: {
            containerListenerRegistrationCount: 138,
            containerListeningMarkerPropertyCount: 1,
            containerMarkerPropertyCount: 1,
            containerMarkerTruthyCount: 1,
            ownerDocumentListenerRegistrationCount: 1,
            ownerDocumentListeningMarkerPropertyCount: 1
          },
          before: {
            containerListenerRegistrationCount: 0,
            containerListeningMarkerPropertyCount: 0,
            containerMarkerPropertyCount: 0,
            containerMarkerTruthyCount: 0,
            ownerDocumentListenerRegistrationCount: 0,
            ownerDocumentListeningMarkerPropertyCount: 0
          },
          cleanup: {
            afterCleanup: {
              containerListenerRegistrationCount: 0,
              containerListeningMarkerPropertyCount: 0,
              containerMarkerPropertyCount: 0,
              containerMarkerTruthyCount: 0,
              ownerDocumentListenerRegistrationCount: 0,
              ownerDocumentListeningMarkerPropertyCount: 0
            },
            status: "reverted-private-root-create-mark-listen-gate"
          },
          status: "applied-private-root-create-mark-listen-gate"
        }
      };
    default:
      return null;
  }
}

function expectedSyncFlushCrossRootReconcilerDiagnostics() {
  return {
    loadError: null,
    commitWorkOnAllRootsPathPresent: true,
    crossRootDiagnosticMethodPresent: true,
    crossRootDiagnosticStructPresent: true,
    crossRootDiagnosticTestPresent: true,
    scheduledRootTraversalPresent: true,
    syncLaneConsumptionCheckPresent: true
  };
}

function expectedPrivateActEvidence() {
  return {
    reactActPrivateDispatcher: {
      continuationFlushingReady: false,
      executesEffects: false,
      executesQueuedWork: false,
      passiveEffectsReady: false,
      publicCompatibilityClaimed: false,
      queueFlushingReady: false,
      rendererRootsReady: false,
      status: "blocked-until-renderer-roots-passive-effects-and-act-continuations"
    },
    reactActQueueMetadata: {
      acceptedRendererBackedActDrainReconcilerRecords: [
        "SyncFlushActContinuationDrainRecord",
        "SyncFlushActPrivateExecutionDiagnosticsForCanary",
        "SyncFlushPostPassiveContinuationExecutionRecord",
        "PassiveEffectsFlushWithSyncFlushContinuationResult"
      ],
      consumesRendererBackedActDrainDiagnostics: true,
      drainsAcceptedRendererBackedActDiagnostics: true,
      drainsPublicReactActQueue: false,
      executesEffects: false,
      executesQueuedWork: false,
      executesRendererRoots: false,
      publicReactActCompatibilityClaimed: false,
      rendererBackedActDrainDiagnosticsReady: true
    },
    rendererBackedActDrainDiagnostics: {
      acceptedReconcilerRecords: [
        "SyncFlushActContinuationDrainRecord",
        "SyncFlushActPrivateExecutionDiagnosticsForCanary",
        "SyncFlushPostPassiveContinuationExecutionRecord",
        "PassiveEffectsFlushWithSyncFlushContinuationResult"
      ],
      drainsPublicReactActQueue: false,
      executesEffects: false,
      executesQueuedWork: false,
      executesRendererRoots: false,
      kind: "fast-react.react.private-renderer-backed-act-drain-diagnostic",
      publicReactActCompatibilityClaimed: false,
      renderer: "fast-react-test-renderer",
      status: "private-renderer-backed-act-drain-diagnostics"
    },
    rendererBackedActDrainConsumption: {
      accepted: true,
      drainsPublicReactActQueue: false,
      executesEffects: false,
      executesQueuedWork: false,
      executesRendererRoots: false,
      publicReactActCompatibilityClaimed: false,
      renderer: "fast-react-test-renderer",
      status: "consumed-accepted-renderer-backed-act-drain-diagnostics"
    },
    reactDomTestUtilsActGate: {
      id: "react-dom-test-utils-act-private-routing-gate-5",
      privatePrerequisitesPresent: true,
      privateRoutingReady: false,
      publicCompatibilityClaimed: false,
      publicReactActReady: false,
      publicTestUtilsActReady: false,
      status: "blocked-public-test-utils-act-private-routing",
      sideEffectPolicy: {
        invokesActCallback: false,
        executesQueuedWork: false,
        executesPassiveEffects: false,
        executesRendererRoots: false,
        executesPublicRendererRoots: false,
        executesPublicDomMutation: false,
        executesSyncFlush: false,
        emitsDeprecationWarning: false,
        delegatesToReactAct: false
      }
    }
  };
}

function expectedPrivatePassiveEvidence() {
  return {
    passiveEffectCallbackHandles: {
      effectCallbackExecutionReady: false,
      invokesCreateCallbacks: false,
      invokesCreateCallbacksUnderTestControl: true,
      invokesDestroyCallbacks: false,
      invokesDestroyCallbacksUnderTestControl: true,
      publicActCompatibilityClaimed: false,
      publicEffectExecutionEnabled: false,
      schedulerDrivenPassiveExecutionEnabled: false,
      status: "private-passive-effect-callback-invocation-test-control-only",
      testControlledInvocationOnly: true
    },
    passiveEffects: {
      consumesPendingPassiveMetadata: true,
      discoversCommittedFiberEffects: false,
      executesPassiveEffects: false,
      hasSyncFlushContinuationWrapper: true,
      invokesCreateCallbacks: false,
      invokesDestroyCallbacks: false,
      status: "metadata-only-passive-flush-without-callback-execution"
    },
    syncFlushPostPassiveContinuationExecution: {
      consumesPendingPassive: true,
      executesPassiveEffects: false,
      executesSyncFlush: true,
      invokesCallbacks: false,
      privateExecution: true,
      status:
        "private-sync-flush-post-passive-continuation-executes-follow-up-sync-flush"
    }
  };
}

function expectedActPassiveSourceDiagnostics() {
  return {
    loadError: null,
    passiveCallbackInvocationGatePresent: true,
    passiveDestroyExecutorPresent: true,
    passiveErrorCaptureRecordPresent: true,
    passiveSchedulerFlushGatePresent: true,
    reactActRendererBackedDrainDiagnosticPresent: true,
    reactDomTestUtilsActPrivateRoutingGatePresent: true,
    reactDomTestUtilsPublicActBlockedPresent: true
  };
}

function expectedPrivateCrossRootSchedulingEvidence() {
  const afterApply = expectedPrivateRootSideEffectStateAfterApply();
  return {
    rootSideEffectEvidence: {
      first: expectedPrivateRootSideEffectEvidence(),
      second: expectedPrivateRootSideEffectEvidence()
    },
    schedulingEvidence: {
      callbackEvents: [
        "root.render:first",
        "root.render:second",
        "flushSyncWork"
      ],
      callbackRenderRequestCount: 2,
      callbackReturnValue: "two-root-flush-complete",
      committedRootCountAfterFlush: 2,
      flushSyncGuardWarningCount: 0,
      flushSyncWorkCallCount: 1,
      flushSyncWorkWasInRender: false,
      privateReconcilerDiagnostics:
        expectedSyncFlushCrossRootReconcilerDiagnostics(),
      publicFlushSyncCompatibilityClaimed: false,
      rootSideEffectStateAfterFlush: {
        first: afterApply,
        second: afterApply
      },
      scheduledRootCount: 2
    }
  };
}

function expectedPrivateRootSideEffectEvidence() {
  return {
    afterApply: expectedPrivateRootSideEffectStateAfterApply(),
    before: expectedPrivateRootSideEffectStateBefore(),
    cleanup: {
      afterCleanup: expectedPrivateRootSideEffectStateBefore(),
      status: "reverted-private-root-create-mark-listen-gate"
    },
    status: "applied-private-root-create-mark-listen-gate"
  };
}

function expectedPrivateRootSideEffectStateBefore() {
  return {
    containerListenerRegistrationCount: 0,
    containerListeningMarkerPropertyCount: 0,
    containerMarkerPropertyCount: 0,
    containerMarkerTruthyCount: 0,
    ownerDocumentListenerRegistrationCount: 0,
    ownerDocumentListeningMarkerPropertyCount: 0
  };
}

function expectedPrivateRootSideEffectStateAfterApply() {
  return {
    containerListenerRegistrationCount: 138,
    containerListeningMarkerPropertyCount: 1,
    containerMarkerPropertyCount: 1,
    containerMarkerTruthyCount: 1,
    ownerDocumentListenerRegistrationCount: 1,
    ownerDocumentListeningMarkerPropertyCount: 1
  };
}

function comparablePrivateCrossRootSchedulingDiagnosticEvidence(evidence) {
  return {
    rootSideEffectEvidence: {
      first: comparablePrivateHostOutputRootSideEffectEvidence(
        evidence.rootSideEffectEvidence.first
      ),
      second: comparablePrivateHostOutputRootSideEffectEvidence(
        evidence.rootSideEffectEvidence.second
      )
    },
    schedulingEvidence: {
      callbackEvents: evidence.schedulingEvidence.callbackEvents,
      callbackRenderRequestCount:
        evidence.schedulingEvidence.callbackRenderRequestCount,
      callbackReturnValue: evidence.schedulingEvidence.callbackReturnValue,
      committedRootCountAfterFlush:
        evidence.schedulingEvidence.committedRootCountAfterFlush,
      flushSyncGuardWarningCount:
        evidence.schedulingEvidence.flushSyncGuardWarningCount,
      flushSyncWorkCallCount: evidence.schedulingEvidence.flushSyncWorkCallCount,
      flushSyncWorkWasInRender:
        evidence.schedulingEvidence.flushSyncWorkWasInRender,
      privateReconcilerDiagnostics:
        evidence.schedulingEvidence.privateReconcilerDiagnostics,
      publicFlushSyncCompatibilityClaimed:
        evidence.schedulingEvidence.publicFlushSyncCompatibilityClaimed,
      rootSideEffectStateAfterFlush:
        evidence.schedulingEvidence.rootSideEffectStateAfterFlush,
      scheduledRootCount: evidence.schedulingEvidence.scheduledRootCount
    }
  };
}

function comparablePrivateActEvidence(evidence) {
  return {
    reactActPrivateDispatcher: {
      continuationFlushingReady:
        evidence.reactActPrivateDispatcher?.continuationFlushingReady,
      executesEffects: evidence.reactActPrivateDispatcher?.executesEffects,
      executesQueuedWork:
        evidence.reactActPrivateDispatcher?.executesQueuedWork,
      passiveEffectsReady:
        evidence.reactActPrivateDispatcher?.passiveEffectsReady,
      publicCompatibilityClaimed:
        evidence.reactActPrivateDispatcher?.publicCompatibilityClaimed,
      queueFlushingReady:
        evidence.reactActPrivateDispatcher?.queueFlushingReady,
      rendererRootsReady:
        evidence.reactActPrivateDispatcher?.rendererRootsReady,
      status: evidence.reactActPrivateDispatcher?.status
    },
    reactActQueueMetadata: {
      acceptedRendererBackedActDrainReconcilerRecords:
        evidence.reactActQueueMetadata
          ?.acceptedRendererBackedActDrainReconcilerRecords,
      consumesRendererBackedActDrainDiagnostics:
        evidence.reactActQueueMetadata
          ?.consumesRendererBackedActDrainDiagnostics,
      drainsAcceptedRendererBackedActDiagnostics:
        evidence.reactActQueueMetadata
          ?.drainsAcceptedRendererBackedActDiagnostics,
      drainsPublicReactActQueue:
        evidence.reactActQueueMetadata?.drainsPublicReactActQueue,
      executesEffects: evidence.reactActQueueMetadata?.executesEffects,
      executesQueuedWork:
        evidence.reactActQueueMetadata?.executesQueuedWork,
      executesRendererRoots:
        evidence.reactActQueueMetadata?.executesRendererRoots,
      publicReactActCompatibilityClaimed:
        evidence.reactActQueueMetadata?.publicReactActCompatibilityClaimed,
      rendererBackedActDrainDiagnosticsReady:
        evidence.reactActQueueMetadata
          ?.rendererBackedActDrainDiagnosticsReady
    },
    rendererBackedActDrainDiagnostics: {
      acceptedReconcilerRecords:
        evidence.rendererBackedActDrainDiagnostics?.acceptedReconcilerRecords,
      drainsPublicReactActQueue:
        evidence.rendererBackedActDrainDiagnostics?.drainsPublicReactActQueue,
      executesEffects:
        evidence.rendererBackedActDrainDiagnostics?.executesEffects,
      executesQueuedWork:
        evidence.rendererBackedActDrainDiagnostics?.executesQueuedWork,
      executesRendererRoots:
        evidence.rendererBackedActDrainDiagnostics?.executesRendererRoots,
      kind: evidence.rendererBackedActDrainDiagnostics?.kind,
      publicReactActCompatibilityClaimed:
        evidence.rendererBackedActDrainDiagnostics
          ?.publicReactActCompatibilityClaimed,
      renderer: evidence.rendererBackedActDrainDiagnostics?.renderer,
      status: evidence.rendererBackedActDrainDiagnostics?.status
    },
    rendererBackedActDrainConsumption: {
      accepted: evidence.rendererBackedActDrainConsumption?.accepted,
      drainsPublicReactActQueue:
        evidence.rendererBackedActDrainConsumption?.drainsPublicReactActQueue,
      executesEffects:
        evidence.rendererBackedActDrainConsumption?.executesEffects,
      executesQueuedWork:
        evidence.rendererBackedActDrainConsumption?.executesQueuedWork,
      executesRendererRoots:
        evidence.rendererBackedActDrainConsumption?.executesRendererRoots,
      publicReactActCompatibilityClaimed:
        evidence.rendererBackedActDrainConsumption
          ?.publicReactActCompatibilityClaimed,
      renderer: evidence.rendererBackedActDrainConsumption?.renderer,
      status: evidence.rendererBackedActDrainConsumption?.status
    },
    reactDomTestUtilsActGate: {
      id: evidence.reactDomTestUtilsActGate?.id,
      privatePrerequisitesPresent:
        evidence.reactDomTestUtilsActGate?.privatePrerequisitesPresent,
      privateRoutingReady:
        evidence.reactDomTestUtilsActGate?.privateRoutingReady,
      publicCompatibilityClaimed:
        evidence.reactDomTestUtilsActGate?.publicCompatibilityClaimed,
      publicReactActReady:
        evidence.reactDomTestUtilsActGate?.publicReactActReady,
      publicTestUtilsActReady:
        evidence.reactDomTestUtilsActGate?.publicTestUtilsActReady,
      status: evidence.reactDomTestUtilsActGate?.status,
      sideEffectPolicy: evidence.reactDomTestUtilsActGate?.sideEffectPolicy
    }
  };
}

function comparablePrivatePassiveEvidence(evidence) {
  return {
    passiveEffectCallbackHandles: {
      effectCallbackExecutionReady:
        evidence.passiveEffectCallbackHandles?.effectCallbackExecutionReady,
      invokesCreateCallbacks:
        evidence.passiveEffectCallbackHandles?.invokesCreateCallbacks,
      invokesCreateCallbacksUnderTestControl:
        evidence.passiveEffectCallbackHandles
          ?.invokesCreateCallbacksUnderTestControl,
      invokesDestroyCallbacks:
        evidence.passiveEffectCallbackHandles?.invokesDestroyCallbacks,
      invokesDestroyCallbacksUnderTestControl:
        evidence.passiveEffectCallbackHandles
          ?.invokesDestroyCallbacksUnderTestControl,
      publicActCompatibilityClaimed:
        evidence.passiveEffectCallbackHandles?.publicActCompatibilityClaimed,
      publicEffectExecutionEnabled:
        evidence.passiveEffectCallbackHandles?.publicEffectExecutionEnabled,
      schedulerDrivenPassiveExecutionEnabled:
        evidence.passiveEffectCallbackHandles
          ?.schedulerDrivenPassiveExecutionEnabled,
      status: evidence.passiveEffectCallbackHandles?.status,
      testControlledInvocationOnly:
        evidence.passiveEffectCallbackHandles?.testControlledInvocationOnly
    },
    passiveEffects: {
      consumesPendingPassiveMetadata:
        evidence.passiveEffects?.consumesPendingPassiveMetadata,
      discoversCommittedFiberEffects:
        evidence.passiveEffects?.discoversCommittedFiberEffects,
      executesPassiveEffects: evidence.passiveEffects?.executesPassiveEffects,
      hasSyncFlushContinuationWrapper:
        evidence.passiveEffects?.hasSyncFlushContinuationWrapper,
      invokesCreateCallbacks: evidence.passiveEffects?.invokesCreateCallbacks,
      invokesDestroyCallbacks:
        evidence.passiveEffects?.invokesDestroyCallbacks,
      status: evidence.passiveEffects?.status
    },
    syncFlushPostPassiveContinuationExecution: {
      consumesPendingPassive:
        evidence.syncFlushPostPassiveContinuationExecution
          ?.consumesPendingPassive,
      executesPassiveEffects:
        evidence.syncFlushPostPassiveContinuationExecution
          ?.executesPassiveEffects,
      executesSyncFlush:
        evidence.syncFlushPostPassiveContinuationExecution?.executesSyncFlush,
      invokesCallbacks:
        evidence.syncFlushPostPassiveContinuationExecution?.invokesCallbacks,
      privateExecution:
        evidence.syncFlushPostPassiveContinuationExecution?.privateExecution,
      status: evidence.syncFlushPostPassiveContinuationExecution?.status
    }
  };
}

function comparableActPassiveSourceDiagnostics(diagnostics) {
  return {
    loadError: diagnostics?.loadError,
    passiveCallbackInvocationGatePresent:
      diagnostics?.passiveCallbackInvocationGatePresent,
    passiveDestroyExecutorPresent:
      diagnostics?.passiveDestroyExecutorPresent,
    passiveErrorCaptureRecordPresent:
      diagnostics?.passiveErrorCaptureRecordPresent,
    passiveSchedulerFlushGatePresent:
      diagnostics?.passiveSchedulerFlushGatePresent,
    reactActRendererBackedDrainDiagnosticPresent:
      diagnostics?.reactActRendererBackedDrainDiagnosticPresent,
    reactDomTestUtilsActPrivateRoutingGatePresent:
      diagnostics?.reactDomTestUtilsActPrivateRoutingGatePresent,
    reactDomTestUtilsPublicActBlockedPresent:
      diagnostics?.reactDomTestUtilsPublicActBlockedPresent
  };
}

function comparablePrivateHostOutputScenarioEvidence(evidence) {
  if (evidence.flushSyncEvidence !== undefined) {
    return {
      firstRoot: comparableMountedPrivateHostOutput(evidence.firstRoot),
      flushSyncEvidence: {
        callbackEvents: evidence.flushSyncEvidence.callbackEvents,
        callbackRenderRequestCount:
          evidence.flushSyncEvidence.callbackRenderRequestCount,
        callbackReturnValue: evidence.flushSyncEvidence.callbackReturnValue,
        committedRootCountAfterFlush:
          evidence.flushSyncEvidence.committedRootCountAfterFlush,
        flushSyncGuardWarningCount:
          evidence.flushSyncEvidence.flushSyncGuardWarningCount,
        flushSyncWorkCallCount:
          evidence.flushSyncEvidence.flushSyncWorkCallCount,
        flushSyncWorkWasInRender:
          evidence.flushSyncEvidence.flushSyncWorkWasInRender,
        privateReconcilerDiagnostics:
          evidence.flushSyncEvidence.privateReconcilerDiagnostics,
        publicFlushSyncCompatibilityClaimed:
          evidence.flushSyncEvidence.publicFlushSyncCompatibilityClaimed,
        rootSideEffectStateAfterFlush:
          evidence.flushSyncEvidence.rootSideEffectStateAfterFlush
      },
      secondRoot: comparableMountedPrivateHostOutput(evidence.secondRoot),
      secondRootSideEffectEvidence:
        comparablePrivateHostOutputRootSideEffectEvidence(
          evidence.secondRootSideEffectEvidence
        )
    };
  }

  if (evidence.replaceMutationLog !== undefined) {
    return {
      initialChildNodeNames: evidence.initialChildNodeNames,
      initialContainerTextContent: evidence.initialContainerTextContent,
      initialHandoff: evidence.initialHandoff,
      initialLatestPropsPublished: evidence.initialLatestPropsPublished,
      nestedChildNodeNames: evidence.nestedChildNodeNames,
      nestedHandoff: evidence.nestedHandoff,
      nestedLatestPropsPublished: evidence.nestedLatestPropsPublished,
      removedHostDetachedFromLatestPropsMap:
        evidence.removedHostDetachedFromLatestPropsMap,
      replaceAttributes: evidence.replaceAttributes,
      replaceChildNodeNames: evidence.replaceChildNodeNames,
      replaceContainerChildCount: evidence.replaceContainerChildCount,
      replaceContainerTextContent: evidence.replaceContainerTextContent,
      replacementHandoff: evidence.replacementHandoff,
      replacementLatestPropsPublished:
        evidence.replacementLatestPropsPublished,
      replaceMutationLog: evidence.replaceMutationLog,
      textNodeValue: evidence.textNodeValue,
      textWriteLog: evidence.textWriteLog
    };
  }

  if (evidence.containerChildCountAfterRenderNull !== undefined) {
    return {
      childNodeNamesAfterRenderNull: evidence.childNodeNamesAfterRenderNull,
      containerChildCountAfterRenderNull:
        evidence.containerChildCountAfterRenderNull,
      containerTextContentAfterRenderNull:
        evidence.containerTextContentAfterRenderNull,
      hostDetachedFromLatestPropsMap: evidence.hostDetachedFromLatestPropsMap,
      renderNullMutationLog: evidence.renderNullMutationLog,
      renderNullMutationObserved: evidence.renderNullMutationObserved,
      rootSideEffectStateAfterRenderNull:
        evidence.rootSideEffectStateAfterRenderNull
    };
  }

  if (evidence.secondUnmountMutationLog !== undefined) {
    return {
      childNodeNamesAfterSecondUnmount:
        evidence.childNodeNamesAfterSecondUnmount,
      childNodeNamesAfterUnmount: evidence.childNodeNamesAfterUnmount,
      containerChildCountAfterSecondUnmount:
        evidence.containerChildCountAfterSecondUnmount,
      containerChildCountAfterUnmount: evidence.containerChildCountAfterUnmount,
      containerTextContentAfterSecondUnmount:
        evidence.containerTextContentAfterSecondUnmount,
      containerTextContentAfterUnmount: evidence.containerTextContentAfterUnmount,
      hostDetachedFromLatestPropsMap: evidence.hostDetachedFromLatestPropsMap,
      secondUnmountBridgeNoOp: evidence.secondUnmountBridgeNoOp,
      secondUnmountHostMutationObserved:
        evidence.secondUnmountHostMutationObserved,
      secondUnmountMutationLog: evidence.secondUnmountMutationLog,
      unmountMutationObserved: evidence.unmountMutationObserved
    };
  }

  if (evidence.renderAfterUnmountError !== undefined) {
    return {
      childNodeNamesAfterRenderAttempt:
        evidence.childNodeNamesAfterRenderAttempt,
      childNodeNamesAfterUnmount: evidence.childNodeNamesAfterUnmount,
      containerChildCountAfterRenderAttempt:
        evidence.containerChildCountAfterRenderAttempt,
      containerChildCountAfterUnmount: evidence.containerChildCountAfterUnmount,
      containerTextContentAfterRenderAttempt:
        evidence.containerTextContentAfterRenderAttempt,
      containerTextContentAfterUnmount: evidence.containerTextContentAfterUnmount,
      hostDetachedFromLatestPropsMap: evidence.hostDetachedFromLatestPropsMap,
      renderAfterUnmountError: evidence.renderAfterUnmountError,
      renderAfterUnmountHostMutationObserved:
        evidence.renderAfterUnmountHostMutationObserved,
      renderAfterUnmountMutationLog: evidence.renderAfterUnmountMutationLog,
      unmountMutationObserved: evidence.unmountMutationObserved
    };
  }

  if (evidence.containerChildCountAfterUnmount !== undefined) {
    return {
      childNodeNamesAfterUnmount: evidence.childNodeNamesAfterUnmount,
      containerChildCountAfterUnmount: evidence.containerChildCountAfterUnmount,
      containerTextContentAfterUnmount: evidence.containerTextContentAfterUnmount,
      hostDetachedFromLatestPropsMap: evidence.hostDetachedFromLatestPropsMap,
      unmountMutationObserved: evidence.unmountMutationObserved
    };
  }

  if (evidence.updateMutationObserved === true) {
    return {
      attributes: evidence.attributes,
      childNodeNames: evidence.childNodeNames,
      containerChildCount: evidence.containerChildCount,
      containerTextContent: evidence.containerTextContent,
      handoff: evidence.handoff,
      latestPropsAfterCommit: evidence.latestPropsAfterCommit,
      latestPropsBeforeCommit: evidence.latestPropsBeforeCommit,
      latestPropsPublished: evidence.latestPropsPublished,
      textNodeValue: evidence.textNodeValue,
      textWriteLog: evidence.textWriteLog,
      updateMutationObserved: evidence.updateMutationObserved
    };
  }

  if (evidence.hostMutationObserved === true) {
    return {
      attributes: evidence.attributes,
      childNodeNames: evidence.childNodeNames,
      containerChildCount: evidence.containerChildCount,
      containerTextContent: evidence.containerTextContent,
      handoff: evidence.handoff,
      hostMutationObserved: evidence.hostMutationObserved,
      latestPropsAfterCommit: evidence.latestPropsAfterCommit,
      latestPropsBeforeCommit: evidence.latestPropsBeforeCommit,
      latestPropsPublished: evidence.latestPropsPublished,
      textNodeValue: evidence.textNodeValue,
      textWriteLog: evidence.textWriteLog
    };
  }

  return {
    childNodeNames: evidence.childNodeNames,
    containerChildCount: evidence.containerChildCount,
    containerTextContent: evidence.containerTextContent,
    hostMutationObserved: evidence.hostMutationObserved,
    latestPropsPublished: evidence.latestPropsPublished
  };
}

function comparableMountedPrivateHostOutput(evidence) {
  return {
    attributes: evidence.attributes,
    childNodeNames: evidence.childNodeNames,
    containerChildCount: evidence.containerChildCount,
    containerTextContent: evidence.containerTextContent,
    handoff: evidence.handoff,
    hostMutationObserved: evidence.hostMutationObserved,
    latestPropsAfterCommit: evidence.latestPropsAfterCommit,
    latestPropsBeforeCommit: evidence.latestPropsBeforeCommit,
    latestPropsPublished: evidence.latestPropsPublished,
    textNodeValue: evidence.textNodeValue,
    textWriteLog: evidence.textWriteLog
  };
}

function comparablePrivateHostOutputRootSideEffectEvidence(evidence) {
  return {
    afterApply: evidence.afterApply,
    before: evidence.before,
    cleanup: {
      afterCleanup: evidence.cleanup.afterCleanup,
      status: evidence.cleanup.record.sideEffectStatus
    },
    status: evidence.record.sideEffectStatus
  };
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

function validatePrivateHostOutputAdmissionMetadata({
  privateHostOutputAdmissionByScenario,
  failures
}) {
  for (const scenarioId of REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS) {
    if (!privateHostOutputAdmissionByScenario.has(scenarioId)) {
      failures.push({
        scenarioId,
        gateStatus: "missing-private-root-host-output-admission"
      });
    }
  }

  for (const [scenarioId, admission] of privateHostOutputAdmissionByScenario) {
    if (!REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.includes(scenarioId)) {
      failures.push({
        scenarioId,
        gateStatus: "unknown-private-root-host-output-admission-scenario"
      });
    }
    if (
      admission.admission !== "private-host-output-diagnostic" &&
      admission.admission !== "unsupported"
    ) {
      failures.push({
        scenarioId,
        gateStatus: "unknown-private-root-host-output-admission",
        admission: admission.admission
      });
    }
    if (
      admission.admission === "private-host-output-diagnostic" &&
      expectedPrivateHostOutputRequestOperations(scenarioId).length === 0
    ) {
      failures.push({
        scenarioId,
        gateStatus: "missing-private-root-host-output-plan"
      });
    }
  }
}

function validatePrivateWarningBoundaryAdmissionMetadata({
  privateWarningBoundaryAdmissionByScenario,
  failures
}) {
  for (const scenarioId of REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS) {
    if (!privateWarningBoundaryAdmissionByScenario.has(scenarioId)) {
      failures.push({
        scenarioId,
        gateStatus: "missing-private-root-warning-boundary-admission"
      });
    }
  }

  for (const [scenarioId, admission] of privateWarningBoundaryAdmissionByScenario) {
    if (!REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.includes(scenarioId)) {
      failures.push({
        scenarioId,
        gateStatus: "unknown-private-root-warning-boundary-admission-scenario"
      });
    }
    if (
      admission.admission !== "private-warning-boundary-diagnostic" &&
      admission.admission !== "unsupported"
    ) {
      failures.push({
        scenarioId,
        gateStatus: "unknown-private-root-warning-boundary-admission",
        admission: admission.admission
      });
    }
    if (
      admission.admission === "private-warning-boundary-diagnostic" &&
      scenarioId !== "development-warning-boundaries"
    ) {
      failures.push({
        scenarioId,
        gateStatus: "unexpected-private-root-warning-boundary-admission"
      });
    }
  }
}

function validatePrivateCrossRootSchedulingAdmissionMetadata({
  privateCrossRootSchedulingAdmissionByScenario,
  failures
}) {
  for (const scenarioId of REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS) {
    if (!privateCrossRootSchedulingAdmissionByScenario.has(scenarioId)) {
      failures.push({
        scenarioId,
        gateStatus: "missing-private-cross-root-scheduling-admission"
      });
    }
  }

  for (const [
    scenarioId,
    admission
  ] of privateCrossRootSchedulingAdmissionByScenario) {
    if (!REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.includes(scenarioId)) {
      failures.push({
        scenarioId,
        gateStatus: "unknown-private-cross-root-scheduling-admission-scenario"
      });
    }
    if (
      admission.admission !== "private-cross-root-scheduling-diagnostic" &&
      admission.admission !== "unsupported"
    ) {
      failures.push({
        scenarioId,
        gateStatus: "unknown-private-cross-root-scheduling-admission",
        admission: admission.admission
      });
    }
    if (
      admission.admission === "private-cross-root-scheduling-diagnostic" &&
      scenarioId !== "flush-sync-cross-root-render"
    ) {
      failures.push({
        scenarioId,
        gateStatus: "unexpected-private-cross-root-scheduling-admission"
      });
    }
  }
}

function validatePrivateActPassiveAdmissionMetadata({
  privateActPassiveAdmissionByScenario,
  failures
}) {
  for (const scenarioId of REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS) {
    if (!privateActPassiveAdmissionByScenario.has(scenarioId)) {
      failures.push({
        scenarioId,
        gateStatus: "missing-private-root-act-passive-admission-metadata"
      });
    }
  }

  for (const [
    scenarioId,
    admission
  ] of privateActPassiveAdmissionByScenario) {
    if (!REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.includes(scenarioId)) {
      failures.push({
        scenarioId,
        gateStatus: "unknown-private-root-act-passive-admission-scenario"
      });
      continue;
    }

    if (
      admission.admission === "private-act-passive-diagnostic" &&
      admission.gateStatus ===
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ACCEPTED_STATUS
    ) {
      continue;
    }

    if (
      admission.admission === "unsupported" &&
      admission.gateStatus ===
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_BLOCKED_STATUS
    ) {
      continue;
    }

    failures.push({
      scenarioId,
      gateStatus: "invalid-private-root-act-passive-admission-metadata",
      admission
    });
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
