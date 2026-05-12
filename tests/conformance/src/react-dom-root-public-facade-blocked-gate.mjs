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
  REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_BLOCKED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET,
  REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES,
  REACT_DOM_ROOT_RENDER_E2E_TARGET
} from "./react-dom-root-render-e2e-targets.mjs";
import {
  REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_BOUNDARY_ROWS,
  REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ADMISSIONS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_BLOCKED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ADMISSIONS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_BLOCKED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_ADMISSIONS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_HOST_OUTPUT_BLOCKED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ADMISSIONS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ADMISSIONS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_CLAIM_KEYS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_ADMISSIONS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_BLOCKED_STATUS,
  evaluateReactDomRootRenderE2EConformanceGate
} from "./react-dom-root-render-e2e-conformance-gate.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);
const require = createRequire(import.meta.url);

const MINIMAL_PUBLIC_CREATE_ROOT_SCENARIO_ID = "create-root-no-render";

function isMinimalPublicCreateRootKnownMismatch({ scenarioId, comparison }) {
  return (
    scenarioId === MINIMAL_PUBLIC_CREATE_ROOT_SCENARIO_ID &&
    comparison?.status === "known-mismatch" &&
    comparison.compatibilityClaimed === false &&
    comparison.firstDifferencePath !== null
  );
}

export const REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_GATE_ID =
  "react-dom-root-public-facade-blocked-gate-1";

export const REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS =
  "blocked-public-root-facade-placeholder";

export const REACT_DOM_ROOT_PUBLIC_FACADE_BRIDGE_RECORD_ONLY_STATUS =
  "blocked-private-root-bridge-record-only";

export const REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_GATE_ID =
  "public-facade-private-promotion-503-533-blocked-gate-1";

export const REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_REJECTED_STATUS =
  "rejected-accepted-private-503-533-public-compatibility-promotion";

export const REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_CLAIM_KEYS =
  Object.freeze([
    "publicRootCompatibilitySurface",
    "publicRenderCompatibilityClaimed",
    "publicRootRenderCompatibilityClaimed",
    "publicHydrationCompatibilityClaimed",
    "publicEventCompatibilityClaimed",
    "publicResourceCompatibilityClaimed",
    "publicFormCompatibilityClaimed",
    "publicControlledInputCompatibilityClaimed",
    "publicTestRendererCompatibilityClaimed"
  ]);

export const REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_BLOCKED_SURFACES =
  Object.freeze([
    "root",
    "render",
    "root-render",
    "hydration",
    "event",
    "resource",
    "form",
    "controlled",
    "test-renderer"
  ]);

function privatePromotion503533Claims() {
  return Object.freeze(
    Object.fromEntries(
      REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_CLAIM_KEYS.map(
        (key) => [key, false]
      )
    )
  );
}

function privatePromotion503533Row({
  acceptedPrivateMetadataIds,
  category,
  id,
  primaryCompatibilityArea,
  reason,
  workerId
}) {
  const publicCompatibilityClaims = privatePromotion503533Claims();

  return Object.freeze({
    id,
    workerId,
    category,
    primaryCompatibilityArea,
    admission: "accepted-private-diagnostic",
    gateStatus:
      REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_REJECTED_STATUS,
    promotion: "rejected",
    privateEvidenceOnly: true,
    acceptedPrivateMetadataIds: Object.freeze(acceptedPrivateMetadataIds),
    blockedPublicCompatibilitySurfaces:
      REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_BLOCKED_SURFACES,
    comparedToReactDomOracle: false,
    comparedToReactTestRendererOracle: false,
    compatibilityClaimed: false,
    ...publicCompatibilityClaims,
    publicCompatibilityClaims,
    reason
  });
}

const MINIMAL_PUBLIC_DIV_TEXT_ID = "app&<>\"";
const MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID = "next&<>\"";
const MINIMAL_PUBLIC_DIV_TEXT = "hello & < >";
const MINIMAL_PUBLIC_DIV_TEXT_ESCAPED = "hello &amp; &lt; &gt;";
const MINIMAL_PUBLIC_DIV_TEXT_UPDATE = "again & < >";
const MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ESCAPED = "again &amp; &lt; &gt;";
const MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL = "id removed & < >";
const MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL_ESCAPED =
  "id removed &amp; &lt; &gt;";
const MINIMAL_PUBLIC_DIV_TEXT_ID_ESCAPED = "app&amp;&lt;&gt;&quot;";
const MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID_ESCAPED = "next&amp;&lt;&gt;&quot;";

function minimalPublicDivTextApi(text, id = MINIMAL_PUBLIC_DIV_TEXT_ID) {
  const props =
    id === null ? "null" : `{ id: ${JSON.stringify(id)} }`;
  return `ReactDOMClient.createRoot(container).render(React.createElement("div", ${props}, ${JSON.stringify(text)}))`;
}

const PUBLIC_ROOT_RENDER_INITIAL_API =
  "react-dom/client.createRoot(...).render(initial)";
const MINIMAL_PUBLIC_DIV_TEXT_RENDER_API =
  minimalPublicDivTextApi(MINIMAL_PUBLIC_DIV_TEXT);
const MINIMAL_PUBLIC_DIV_TEXT_UPDATE_API = minimalPublicDivTextApi(
  MINIMAL_PUBLIC_DIV_TEXT_UPDATE,
  MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID
);
const MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL_API =
  `${MINIMAL_PUBLIC_DIV_TEXT_RENDER_API}; root.render(React.createElement("div", null, ${JSON.stringify(MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL)}))`;
const MINIMAL_PUBLIC_DIV_TEXT_UNMOUNT_API =
  `${MINIMAL_PUBLIC_DIV_TEXT_RENDER_API}; root.unmount()`;

export const REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS =
  Object.freeze([
    privatePromotion503533Row({
      id: "worker-503-deleted-subtree-passive-flush-execution",
      workerId: "503",
      category: "passive-effect-root-render",
      primaryCompatibilityArea: "root-render",
      acceptedPrivateMetadataIds: [
        "deleted-subtree-passive-destroy-flush-diagnostic"
      ],
      reason:
        "Deleted-subtree passive destroy flush metadata is private executor evidence and cannot promote public root render, passive effect, or test-renderer compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-504-deletion-fragment-portal-traversal",
      workerId: "504",
      category: "root-unmount-portal-deletion",
      primaryCompatibilityArea: "root",
      acceptedPrivateMetadataIds: [
        "fragment-deletion-subtree-traversal-diagnostic",
        "portal-deletion-subtree-traversal-diagnostic"
      ],
      reason:
        "Fragment and Portal deletion traversal diagnostics stay private and cannot promote public root unmount or portal rendering compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-505-form-action-event-extraction",
      workerId: "505",
      category: "form-event",
      primaryCompatibilityArea: "form",
      acceptedPrivateMetadataIds: ["form-action-event-extraction-metadata"],
      reason:
        "Form action event-extraction rows are metadata-only and cannot promote public form, event, root render, or test-renderer compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-506-form-reset-queue-commit",
      workerId: "506",
      category: "form-reset",
      primaryCompatibilityArea: "form",
      acceptedPrivateMetadataIds: ["form-reset-queue-commit-diagnostic"],
      reason:
        "Form reset queue/commit diagnostics do not inspect real forms or run resets, so public form compatibility remains blocked."
    }),
    privatePromotion503533Row({
      id: "worker-507-resource-map-commit",
      workerId: "507",
      category: "resource",
      primaryCompatibilityArea: "resource",
      acceptedPrivateMetadataIds: ["resource-map-commit-diagnostic"],
      reason:
        "Resource-map commit rows are redacted private records and cannot promote public resource hint or root resource compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-508-stylesheet-load-error-state",
      workerId: "508",
      category: "resource",
      primaryCompatibilityArea: "resource",
      acceptedPrivateMetadataIds: ["stylesheet-load-error-state-diagnostic"],
      reason:
        "Stylesheet load/error state diagnostics do not mutate real resource maps or suspend commits, so public resource compatibility remains blocked."
    }),
    privatePromotion503533Row({
      id: "worker-509-controlled-restore-flush-order",
      workerId: "509",
      category: "controlled",
      primaryCompatibilityArea: "controlled",
      acceptedPrivateMetadataIds: ["controlled-restore-flush-order-diagnostic"],
      reason:
        "Controlled restore write/flush ordering metadata does not execute wrapper restores or mutate live controls."
    }),
    privatePromotion503533Row({
      id: "worker-510-controlled-radio-sibling-props",
      workerId: "510",
      category: "controlled",
      primaryCompatibilityArea: "controlled",
      acceptedPrivateMetadataIds: [
        "controlled-radio-sibling-props-lookup-diagnostic"
      ],
      reason:
        "Radio sibling-props lookup diagnostics are explicit metadata and cannot promote public controlled radio compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-511-react-dom-facade-update-host-output",
      workerId: "511",
      category: "root-render",
      primaryCompatibilityArea: "root-render",
      acceptedPrivateMetadataIds: [
        "public-facade-host-output-update-diagnostic"
      ],
      reason:
        "Private facade update host-output evidence is fake-DOM only and cannot promote public createRoot/root.render compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-512-react-dom-facade-unmount-cleanup",
      workerId: "512",
      category: "root-unmount",
      primaryCompatibilityArea: "root",
      acceptedPrivateMetadataIds: [
        "public-facade-host-output-unmount-cleanup-diagnostic"
      ],
      reason:
        "Private facade unmount cleanup clears fake-DOM diagnostics only and cannot promote public root unmount compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-513-dom-event-broader-type-dispatch",
      workerId: "513",
      category: "event",
      primaryCompatibilityArea: "event",
      acceptedPrivateMetadataIds: ["event-type-dispatch-canary-record"],
      reason:
        "Broader event-type dispatch canaries record priority/listener metadata without public browser dispatch or SyntheticEvent compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-514-dom-event-portal-error-routing",
      workerId: "514",
      category: "event-portal",
      primaryCompatibilityArea: "event",
      acceptedPrivateMetadataIds: ["portal-event-error-routing-diagnostic"],
      reason:
        "Portal event error routing metadata stays behind private owner-root records and cannot promote public portal bubbling or callback compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-515-test-renderer-query-bridge-preflight",
      workerId: "515",
      category: "test-renderer",
      primaryCompatibilityArea: "test-renderer",
      acceptedPrivateMetadataIds: [
        "test-instance-query-bridge-preflight-diagnostic"
      ],
      reason:
        "TestInstance query bridge preflight consumes accepted records only and cannot promote public react-test-renderer root or query compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-516-test-renderer-committed-fiber-inspection",
      workerId: "516",
      category: "test-renderer",
      primaryCompatibilityArea: "test-renderer",
      acceptedPrivateMetadataIds: [
        "committed-fiber-tree-inspection-shape-diagnostic"
      ],
      reason:
        "Committed-fiber inspection shape diagnostics stay record-only and cannot promote public toTree or TestInstance compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-517-test-renderer-act-warning-thenable-blockers",
      workerId: "517",
      category: "test-renderer-act",
      primaryCompatibilityArea: "test-renderer",
      acceptedPrivateMetadataIds: [
        "react-test-renderer-act-warning-thenable-blocker-row"
      ],
      reason:
        "Act warning/thenable blocker rows are private CJS-development metadata and cannot promote public async act compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-518-scheduler-mock-expired-act-route",
      workerId: "518",
      category: "test-renderer-scheduler",
      primaryCompatibilityArea: "test-renderer",
      acceptedPrivateMetadataIds: [
        "scheduler-mock-expired-work-act-route-diagnostic"
      ],
      reason:
        "Expired mock Scheduler act-route metadata does not flush public Scheduler work or promote react-test-renderer act compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-519-package-surface-private-audit",
      workerId: "519",
      category: "package-surface",
      primaryCompatibilityArea: "root",
      acceptedPrivateMetadataIds: ["package-surface-private-facade-audit"],
      reason:
        "Package-surface private audit evidence pins hidden diagnostics only and cannot promote any public compatibility surface."
    }),
    privatePromotion503533Row({
      id: "worker-520-benchmark-private-diagnostics-canaries",
      workerId: "520",
      category: "benchmark",
      primaryCompatibilityArea: "render",
      acceptedPrivateMetadataIds: ["benchmark-private-diagnostic-canaries"],
      reason:
        "Diagnostic-only benchmark canaries do not collect compatible timings or promote public render/test-renderer compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-521-root-render-e2e-private-gate-refresh",
      workerId: "521",
      category: "root-render",
      primaryCompatibilityArea: "root-render",
      acceptedPrivateMetadataIds: [
        "root-render-private-react-dom-metadata-admissions"
      ],
      reason:
        "Root-render private metadata admissions from workers 486-492 remain explicit source evidence and cannot promote public root compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-522-suspenselist-activity-blockers",
      workerId: "522",
      category: "root-render",
      primaryCompatibilityArea: "render",
      acceptedPrivateMetadataIds: [
        "suspenselist-child-shape-blocker-diagnostic",
        "activity-child-shape-blocker-diagnostic"
      ],
      reason:
        "SuspenseList and Activity child-shape blockers are private fail-closed records and cannot promote public render or hydration compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-523-scheduler-post-task-environment",
      workerId: "523",
      category: "scheduler",
      primaryCompatibilityArea: "render",
      acceptedPrivateMetadataIds: [
        "scheduler-post-task-environment-diagnostic"
      ],
      reason:
        "postTask environment diagnostics are opt-in Scheduler metadata and cannot promote browser task, render, or test-renderer compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-524-native-transport-worker-thread-teardown",
      workerId: "524",
      category: "native",
      primaryCompatibilityArea: "root",
      acceptedPrivateMetadataIds: [
        "native-transport-worker-thread-teardown-diagnostic"
      ],
      reason:
        "Native worker-thread teardown diagnostics do not load native addons or promote public root/render compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-525-react-hook-dispatcher-public-blocker",
      workerId: "525",
      category: "hooks",
      primaryCompatibilityArea: "render",
      acceptedPrivateMetadataIds: [
        "hook-dispatcher-public-blocker-refresh-metadata"
      ],
      reason:
        "Hook dispatcher blocker metadata requires marked private dispatchers and cannot promote public root render or hook compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-526-conformance-private-admission-refresh",
      workerId: "526",
      category: "conformance",
      primaryCompatibilityArea: "root",
      acceptedPrivateMetadataIds: ["private-admission-473-502-manifest"],
      reason:
        "The private-admission conformance manifest records accepted diagnostics only and cannot promote public facade compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-527-worker-launcher-simplification",
      workerId: "527",
      category: "orchestration",
      primaryCompatibilityArea: "root",
      acceptedPrivateMetadataIds: ["worker-launcher-exit-diagnostics"],
      reason:
        "Worker-launcher diagnostics are operational metadata and cannot promote package runtime compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-528-hydration-replay-error-metadata",
      workerId: "528",
      category: "hydration-event",
      primaryCompatibilityArea: "hydration",
      acceptedPrivateMetadataIds: [
        "hydration-replay-error-metadata-diagnostic"
      ],
      reason:
        "Hydration replay error metadata records root-option callbacks without event replay, DOM mutation, callback invocation, or hydration compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-529-portal-root-render-public-blocker",
      workerId: "529",
      category: "root-render-event",
      primaryCompatibilityArea: "root-render",
      acceptedPrivateMetadataIds: [
        "portal-root-render-public-blocker-diagnostic"
      ],
      reason:
        "Portal root-render blocker diagnostics keep private portal metadata outside public root rendering and event compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-530-test-renderer-error-boundary-update",
      workerId: "530",
      category: "test-renderer",
      primaryCompatibilityArea: "test-renderer",
      acceptedPrivateMetadataIds: [
        "test-renderer-error-boundary-update-commit-diagnostic"
      ],
      reason:
        "Error-boundary update/commit rows consume accepted private test-renderer metadata without public recovery or callback compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-531-scheduler-native-entry-guard",
      workerId: "531",
      category: "scheduler",
      primaryCompatibilityArea: "render",
      acceptedPrivateMetadataIds: ["scheduler-native-entry-guard-diagnostic"],
      reason:
        "Scheduler native-entry guard rows pin hidden variant diagnostics and cannot promote public Scheduler, render, or test-renderer compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-532-native-package-surface-guard",
      workerId: "532",
      category: "native",
      primaryCompatibilityArea: "root",
      acceptedPrivateMetadataIds: ["native-package-surface-guard-diagnostic"],
      reason:
        "Native package-surface guard diagnostics remain inert loader metadata and cannot promote public root/native compatibility."
    }),
    privatePromotion503533Row({
      id: "worker-533-controlled-restore-queue-write-preflight",
      workerId: "533",
      category: "controlled",
      primaryCompatibilityArea: "controlled",
      acceptedPrivateMetadataIds: [
        "controlled-restore-queue-write-preflight-diagnostic"
      ],
      reason:
        "Controlled restore queue write preflight rows model intents only and cannot promote public controlled input compatibility."
    })
  ]);

export const REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS =
  Object.freeze([
    Object.freeze({
      id: "public-create-root-render-initial",
      publicApi: PUBLIC_ROOT_RENDER_INITIAL_API,
      scenarioId: "initial-host-render",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateBridgeEvidence: "separate"
    }),
    Object.freeze({
      id: "public-create-root-render-div-text",
      publicApi: MINIMAL_PUBLIC_DIV_TEXT_RENDER_API,
      scenarioId: "initial-host-render",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      controlledDomShim: true,
      expectedChildrenCount: 1,
      expectedChildNodeNames: ["DIV"],
      expectedFirstElementChildAttributes: [["id", MINIMAL_PUBLIC_DIV_TEXT_ID]],
      expectedFirstElementChildGetAttributeId: MINIMAL_PUBLIC_DIV_TEXT_ID,
      expectedFirstElementChildInnerHTML: MINIMAL_PUBLIC_DIV_TEXT_ESCAPED,
      expectedFirstElementChildNodeName: "DIV",
      expectedFirstElementChildStoredPropsChildren: MINIMAL_PUBLIC_DIV_TEXT,
      expectedFirstElementChildStoredPropsHasId: true,
      expectedFirstElementChildStoredPropsId: MINIMAL_PUBLIC_DIV_TEXT_ID,
      expectedFirstElementChildStoredPropsSameObject: true,
      expectedFirstElementChildTagName: "DIV",
      expectedFirstElementChildTextContent: MINIMAL_PUBLIC_DIV_TEXT,
      expectedInnerHTML: `<div id="${MINIMAL_PUBLIC_DIV_TEXT_ID_ESCAPED}">${MINIMAL_PUBLIC_DIV_TEXT_ESCAPED}</div>`,
      expectedMutationLog: [["appendChild", "DIV"]],
      expectedTextContent: MINIMAL_PUBLIC_DIV_TEXT,
      minimalHostOutputAdmission: "render",
      privateBridgeEvidence: "separate"
    }),
    Object.freeze({
      id: "public-create-root-render-update",
      publicApi: MINIMAL_PUBLIC_DIV_TEXT_UPDATE_API,
      scenarioId: "update-host-render",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      controlledDomShim: true,
      expectedChildrenCount: 1,
      expectedChildNodeNames: ["DIV"],
      expectedFirstElementChildAttributes: [
        ["id", MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID]
      ],
      expectedFirstElementChildGetAttributeId:
        MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID,
      expectedFirstElementChildInnerHTML: MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ESCAPED,
      expectedFirstElementChildNodeName: "DIV",
      expectedFirstElementChildStoredPropsChildren:
        MINIMAL_PUBLIC_DIV_TEXT_UPDATE,
      expectedFirstElementChildStoredPropsHasId: true,
      expectedFirstElementChildStoredPropsId:
        MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID,
      expectedFirstElementChildStoredPropsSameObject: true,
      expectedFirstElementChildTagName: "DIV",
      expectedFirstElementChildTextContent: MINIMAL_PUBLIC_DIV_TEXT_UPDATE,
      expectedInnerHTML: `<div id="${MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID_ESCAPED}">${MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ESCAPED}</div>`,
      expectedMutationLog: [["appendChild", "DIV"]],
      expectedTextContent: MINIMAL_PUBLIC_DIV_TEXT_UPDATE,
      minimalHostOutputAdmission: "update",
      privateBridgeEvidence: "separate"
    }),
    Object.freeze({
      id: "public-create-root-render-id-removal",
      publicApi: MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL_API,
      scenarioId: "update-host-render",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      controlledDomShim: true,
      expectedChildrenCount: 1,
      expectedChildNodeNames: ["DIV"],
      expectedFirstElementChildAttributes: [],
      expectedFirstElementChildGetAttributeId: null,
      expectedFirstElementChildInnerHTML:
        MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL_ESCAPED,
      expectedFirstElementChildNodeName: "DIV",
      expectedFirstElementChildStoredPropsChildren:
        MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL,
      expectedFirstElementChildStoredPropsHasId: false,
      expectedFirstElementChildStoredPropsId: null,
      expectedFirstElementChildStoredPropsSameObject: true,
      expectedFirstElementChildTagName: "DIV",
      expectedFirstElementChildTextContent:
        MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL,
      expectedInnerHTML: `<div>${MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL_ESCAPED}</div>`,
      expectedMutationLog: [["appendChild", "DIV"]],
      expectedTextContent: MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL,
      minimalHostOutputAdmission: "id-removal",
      privateBridgeEvidence: "separate"
    }),
    Object.freeze({
      id: "public-create-root-unmount-call",
      publicApi: MINIMAL_PUBLIC_DIV_TEXT_UNMOUNT_API,
      scenarioId: "root-unmount",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      controlledDomShim: true,
      expectedChildrenCount: 0,
      expectedChildNodeNames: [],
      expectedFirstElementChildAttributes: null,
      expectedFirstElementChildGetAttributeId: null,
      expectedFirstElementChildInnerHTML: null,
      expectedFirstElementChildNodeName: null,
      expectedFirstElementChildStoredPropsChildren: null,
      expectedFirstElementChildStoredPropsHasId: null,
      expectedFirstElementChildStoredPropsId: null,
      expectedFirstElementChildStoredPropsSameObject: null,
      expectedFirstElementChildTagName: null,
      expectedFirstElementChildTextContent: null,
      expectedInnerHTML: "",
      expectedMutationLog: [
        ["appendChild", "DIV"],
        ["removeChild", "DIV"]
      ],
      expectedRenderTextContent: MINIMAL_PUBLIC_DIV_TEXT,
      expectedTextContent: "",
      minimalHostOutputAdmission: "unmount",
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
        "Public React DOM root facade behavior stays blocked outside the admitted fake-DOM div text render, id/text update, id removal update, and rendered-root unmount cleanup path."
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
      id: "public-root-render-private-react-dom-metadata-compatibility",
      publicApi:
        "private React DOM host-output/event/resource/form/controlled metadata through public roots",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateReactDomMetadataEvidence: "separate"
    }),
    Object.freeze({
      id: "public-root-work-loop-commit-handoff-compatibility",
      publicApi:
        "private root work-loop and finished-work commit handoff through public createRoot/render/update/unmount/hydrateRoot",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateRootWorkLoopCommitHandoffEvidence: "separate"
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
      id: "public-event-dispatch",
      publicApi: "Synthetic event dispatch through public roots",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateEventEvidence: "separate"
    }),
    Object.freeze({
      id: "public-resource-hints",
      publicApi: "React DOM resource hints through public roots",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateResourceEvidence: "separate"
    }),
    Object.freeze({
      id: "public-form-actions",
      publicApi: "React DOM form actions through public roots",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateFormEvidence: "separate"
    }),
    Object.freeze({
      id: "public-controlled-inputs",
      publicApi: "controlled form inputs through public roots",
      admission: "blocked",
      expectedGateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateControlledInputEvidence: "separate"
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
  privatePromotionRejectionRows503533:
    REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS,
  unsupportedBehavior: Object.freeze({
    publicFacadeStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
    privateBridgeStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BRIDGE_RECORD_ONLY_STATUS,
    compatibilityClaimed: false
  })
});

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

export function evaluateReactDomRootPublicFacadeBlockedGate({
  checkedOracle,
  currentOracle,
  clientRootOracle,
  localPublicFacadeBoundary = inspectReactDomRootPublicFacadeBoundary(),
  privateRootBridgeBoundary = inspectReactDomPrivateRootBridgeBoundary(),
  publicFacadeLifecycleRows = REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS,
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
    publicFacadeLifecycleRows,
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
    privatePromotionRejectionRows503533:
      rootRenderGateResult?.privatePromotionRejectionRows503533 ?? [],
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
      privatePromotion503533RejectedRowCount:
        rootRenderGateResult?.summary
          ?.privatePromotion503533RejectedRowCount ?? 0,
      failureCount: failures.length,
      compatibilityAdmitted: false,
      compatibilityClaimed: false
    }
  };
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
    `Root-render private root work-loop commit handoff rows admitted: ${
      result.rootRenderGate?.summary
        .privateRootWorkLoopCommitHandoffDiagnosticRowCount ?? 0
    }`,
    `Root-render private React DOM metadata diagnostic rows admitted: ${
      result.rootRenderGate?.summary
        .privateReactDomMetadataDiagnosticRowCount ?? 0
    }`,
    `Root-render private 503-533 promotion rows rejected: ${
      result.rootRenderGate?.summary.privatePromotion503533RejectedRowCount ?? 0
    }`,
    `Root-render portal rows blocked: ${
      result.rootRenderGate?.summary.portalRootRenderBlockedRowCount ?? 0
    }`,
    `Failures: ${result.summary.failureCount}`
  ];

  if (result.summary.blockedPublicFacadeRowCount > 0) {
    lines.push(
      "Compatibility remains blocked; minimal public createRoot/div-text render, id/text update, id removal update, and rendered-root unmount cleanup are scoped while hydrateRoot and broad root behavior stay fail-closed."
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
  if (
    (result.rootRenderGate?.summary
      .privateRootWorkLoopCommitHandoffDiagnosticRowCount ?? 0) > 0
  ) {
    lines.push(
      "Private root work-loop and finished-work commit handoff diagnostics remain source evidence only and do not unblock public createRoot, render, update, unmount, hydrateRoot, DOM mutation, or test-renderer compatibility."
    );
  }
  if (
    (result.rootRenderGate?.summary
      .privateReactDomMetadataDiagnosticRowCount ?? 0) > 0
  ) {
    lines.push(
      "Private React DOM metadata diagnostics remain private evidence only and do not unblock public root, hydration, event, resource, form, or controlled-input compatibility."
    );
  }
  if (
    (result.rootRenderGate?.summary.privatePromotion503533RejectedRowCount ??
      0) > 0
  ) {
    lines.push(
      "Accepted private 503-533 diagnostics remain rejected as public-promotion evidence for root, render, hydration, event, resource, form, controlled-input, and test-renderer compatibility."
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
    const React = require(join(workspaceRoot, "packages/react/index.js"));
    const rootMarkers = require(
      join(workspaceRoot, "packages/react-dom/src/client/root-markers.js")
    );
    const listenerRegistry = require(
      join(workspaceRoot, "packages/react-dom/src/events/listener-registry.js")
    );
    const componentTree = require(
      join(workspaceRoot, "packages/react-dom/src/client/component-tree.js")
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
      componentTree,
      domContainer,
      listenerRegistry,
      React,
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
  validateRootRenderPrivateRootWorkLoopCommitHandoffBlockers({
    rootRenderGateResult,
    failures
  });
  validateRootRenderPrivateReactDomMetadataBlockers({
    rootRenderGateResult,
    failures
  });
  validateRootRenderPrivatePromotion503533Blockers({
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

function validateRootRenderPrivateRootWorkLoopCommitHandoffBlockers({
  rootRenderGateResult,
  failures
}) {
  if (!rootRenderGateResult) {
    return;
  }

  const admittedMetadataIds =
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ADMISSIONS.map(
      (admission) => admission.metadataId
    );
  const expectedRows =
    admittedMetadataIds.length * REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length;

  if (
    rootRenderGateResult.summary
      .privateRootWorkLoopCommitHandoffDiagnosticRowCount !== expectedRows
  ) {
    failures.push({
      gateStatus:
        "root-render-private-root-work-loop-commit-handoff-row-count-mismatch",
      actual:
        rootRenderGateResult.summary
          .privateRootWorkLoopCommitHandoffDiagnosticRowCount ?? null,
      expected: expectedRows
    });
  }

  if (
    rootRenderGateResult.summary
      .privateRootWorkLoopCommitHandoffCompatibilityClaimed !== false ||
    rootRenderGateResult.privateRootWorkLoopCommitHandoffGate
      ?.compatibilityClaimed !== false ||
    rootRenderGateResult.summary
      .privateRootWorkLoopCommitHandoffPublicRootCompatibilitySurface !==
      false ||
    rootRenderGateResult.summary
      .privateRootWorkLoopCommitHandoffPublicCreateRootCompatibilityClaimed !==
      false ||
    rootRenderGateResult.summary
      .privateRootWorkLoopCommitHandoffPublicRootRenderCompatibilityClaimed !==
      false ||
    rootRenderGateResult.summary
      .privateRootWorkLoopCommitHandoffPublicRootUpdateCompatibilityClaimed !==
      false ||
    rootRenderGateResult.summary
      .privateRootWorkLoopCommitHandoffPublicRootUnmountCompatibilityClaimed !==
      false ||
    rootRenderGateResult.summary
      .privateRootWorkLoopCommitHandoffPublicHydrateRootCompatibilityClaimed !==
      false ||
    rootRenderGateResult.summary
      .privateRootWorkLoopCommitHandoffPublicHydrationCompatibilityClaimed !==
      false ||
    rootRenderGateResult.summary
      .privateRootWorkLoopCommitHandoffPublicDomMutationCompatibilityClaimed !==
      false ||
    rootRenderGateResult.summary
      .privateRootWorkLoopCommitHandoffPublicTestRendererCompatibilityClaimed !==
      false
  ) {
    failures.push({
      gateStatus:
        "root-render-private-root-work-loop-commit-handoff-claims-compatibility-while-public-facade-blocked",
      summaryClaim:
        rootRenderGateResult.summary
          .privateRootWorkLoopCommitHandoffCompatibilityClaimed ?? null,
      gateClaim:
        rootRenderGateResult.privateRootWorkLoopCommitHandoffGate
          ?.compatibilityClaimed ?? null,
      summaryPublicRootClaim:
        rootRenderGateResult.summary
          .privateRootWorkLoopCommitHandoffPublicRootCompatibilitySurface ??
        null,
      summaryPublicHydrateRootClaim:
        rootRenderGateResult.summary
          .privateRootWorkLoopCommitHandoffPublicHydrateRootCompatibilityClaimed ??
        null,
      summaryPublicTestRendererClaim:
        rootRenderGateResult.summary
          .privateRootWorkLoopCommitHandoffPublicTestRendererCompatibilityClaimed ??
        null
    });
  }

  for (const claimKey of REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_CLAIM_KEYS) {
    if (
      rootRenderGateResult.privateRootWorkLoopCommitHandoffGate?.[claimKey] !==
      false
    ) {
      failures.push({
        gateStatus:
          "root-render-private-root-work-loop-commit-handoff-gate-public-claim-leaked",
        claimKey,
        actual:
          rootRenderGateResult.privateRootWorkLoopCommitHandoffGate?.[claimKey]
      });
    }
  }

  if (
    findFirstDifferencePath(
      rootRenderGateResult.privateRootWorkLoopCommitHandoffGate
        ?.admittedPrivateRootWorkLoopCommitHandoffIds ?? [],
      admittedMetadataIds
    ) !== null
  ) {
    failures.push({
      gateStatus:
        "root-render-private-root-work-loop-commit-handoff-admission-set-mismatch",
      admitted:
        rootRenderGateResult.privateRootWorkLoopCommitHandoffGate
          ?.admittedPrivateRootWorkLoopCommitHandoffIds ?? null
    });
  }

  for (const row of rootRenderGateResult.privateRootWorkLoopCommitHandoffDiagnosticRows ??
    []) {
    const publicClaimLeak =
      REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_CLAIM_KEYS.some(
        (claimKey) =>
          row[claimKey] !== false ||
          row.publicCompatibilityClaims?.[claimKey] !== false
      );

    if (
      row.gateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ACCEPTED_STATUS ||
      row.publicFacadeGateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_BLOCKED_STATUS ||
      row.privateEvidenceOnly !== true ||
      row.publicRootCompatibilitySurface !== false ||
      row.comparedToReactDomOracle !== false ||
      row.comparedToReactTestRendererOracle !== false ||
      row.compatibilityClaimed !== false ||
      publicClaimLeak ||
      !admittedMetadataIds.includes(row.metadataId)
    ) {
      failures.push({
        metadataId: row.metadataId,
        modeId: row.modeId,
        scenarioId: row.scenarioId,
        gateStatus:
          "root-render-private-root-work-loop-commit-handoff-row-not-private",
        row
      });
    }
  }
}

function validateRootRenderPrivateReactDomMetadataBlockers({
  rootRenderGateResult,
  failures
}) {
  if (!rootRenderGateResult) {
    return;
  }

  const admittedMetadataIds =
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ADMISSIONS.map(
      (admission) => admission.metadataId
    );
  const expectedRows =
    admittedMetadataIds.length * REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length;

  if (
    rootRenderGateResult.summary
      .privateReactDomMetadataDiagnosticRowCount !== expectedRows
  ) {
    failures.push({
      gateStatus: "root-render-private-react-dom-metadata-row-count-mismatch",
      actual:
        rootRenderGateResult.summary
          .privateReactDomMetadataDiagnosticRowCount ?? null,
      expected: expectedRows
    });
  }

  if (
    rootRenderGateResult.summary.privateReactDomMetadataCompatibilityClaimed !==
      false ||
    rootRenderGateResult.summary
      .privateReactDomMetadataPublicRootRenderCompatibilityClaimed !== false ||
    rootRenderGateResult.summary
      .privateReactDomMetadataPublicHydrationCompatibilityClaimed !== false ||
    rootRenderGateResult.summary
      .privateReactDomMetadataPublicEventCompatibilityClaimed !== false ||
    rootRenderGateResult.summary
      .privateReactDomMetadataPublicResourceCompatibilityClaimed !== false ||
    rootRenderGateResult.summary
      .privateReactDomMetadataPublicFormCompatibilityClaimed !== false ||
    rootRenderGateResult.summary
      .privateReactDomMetadataPublicControlledInputCompatibilityClaimed !==
      false ||
    rootRenderGateResult.privateReactDomMetadataGate?.compatibilityClaimed !==
      false ||
    rootRenderGateResult.privateReactDomMetadataGate
      ?.publicRootRenderCompatibilityClaimed !== false ||
    rootRenderGateResult.privateReactDomMetadataGate
      ?.publicHydrationCompatibilityClaimed !== false ||
    rootRenderGateResult.privateReactDomMetadataGate
      ?.publicEventCompatibilityClaimed !== false ||
    rootRenderGateResult.privateReactDomMetadataGate
      ?.publicResourceCompatibilityClaimed !== false ||
    rootRenderGateResult.privateReactDomMetadataGate
      ?.publicFormCompatibilityClaimed !== false ||
    rootRenderGateResult.privateReactDomMetadataGate
      ?.publicControlledInputCompatibilityClaimed !== false
  ) {
    failures.push({
      gateStatus:
        "root-render-private-react-dom-metadata-claims-compatibility-while-public-facade-blocked",
      summaryClaim:
        rootRenderGateResult.summary.privateReactDomMetadataCompatibilityClaimed ??
        null,
      summaryPublicRootClaim:
        rootRenderGateResult.summary
          .privateReactDomMetadataPublicRootRenderCompatibilityClaimed ?? null,
      summaryPublicHydrationClaim:
        rootRenderGateResult.summary
          .privateReactDomMetadataPublicHydrationCompatibilityClaimed ?? null,
      summaryPublicEventClaim:
        rootRenderGateResult.summary
          .privateReactDomMetadataPublicEventCompatibilityClaimed ?? null,
      summaryPublicResourceClaim:
        rootRenderGateResult.summary
          .privateReactDomMetadataPublicResourceCompatibilityClaimed ?? null,
      summaryPublicFormClaim:
        rootRenderGateResult.summary
          .privateReactDomMetadataPublicFormCompatibilityClaimed ?? null,
      summaryPublicControlledClaim:
        rootRenderGateResult.summary
          .privateReactDomMetadataPublicControlledInputCompatibilityClaimed ??
        null
    });
  }

  if (
    findFirstDifferencePath(
      rootRenderGateResult.privateReactDomMetadataGate
        ?.admittedPrivateReactDomMetadataIds ?? [],
      admittedMetadataIds
    ) !== null
  ) {
    failures.push({
      gateStatus:
        "root-render-private-react-dom-metadata-admission-set-mismatch",
      admitted:
        rootRenderGateResult.privateReactDomMetadataGate
          ?.admittedPrivateReactDomMetadataIds ?? null
    });
  }

  for (const row of rootRenderGateResult.privateReactDomMetadataDiagnosticRows ??
    []) {
    if (
      row.gateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ACCEPTED_STATUS ||
      row.publicFacadeGateStatus !==
        REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_BLOCKED_STATUS ||
      row.publicRootCompatibilitySurface !== false ||
      row.comparedToReactDomOracle !== false ||
      row.compatibilityClaimed !== false ||
      row.publicRootRenderCompatibilityClaimed !== false ||
      row.publicHydrationCompatibilityClaimed !== false ||
      row.publicEventCompatibilityClaimed !== false ||
      row.publicResourceCompatibilityClaimed !== false ||
      row.publicFormCompatibilityClaimed !== false ||
      row.publicControlledInputCompatibilityClaimed !== false
    ) {
      failures.push({
        metadataId: row.metadataId,
        modeId: row.modeId,
        scenarioId: row.scenarioId,
        gateStatus: "root-render-private-react-dom-metadata-row-not-private",
        row
      });
    }
  }
}

function validateRootRenderPrivatePromotion503533Blockers({
  rootRenderGateResult,
  failures
}) {
  if (!rootRenderGateResult) {
    return;
  }

  const expectedRowIds =
    REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS.map(
      (row) => row.id
    );
  const expectedWorkerIds =
    REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS.map(
      (row) => row.workerId
    );

  if (
    rootRenderGateResult.summary.privatePromotion503533RejectedRowCount !==
    expectedRowIds.length
  ) {
    failures.push({
      gateStatus: "root-render-private-promotion-503-533-row-count-mismatch",
      actual:
        rootRenderGateResult.summary.privatePromotion503533RejectedRowCount ??
        null,
      expected: expectedRowIds.length
    });
  }

  if (
    rootRenderGateResult.summary.privatePromotion503533CompatibilityClaimed !==
      false ||
    rootRenderGateResult.privatePromotion503533Gate?.compatibilityClaimed !==
      false ||
    rootRenderGateResult.summary
      .privatePromotion503533PublicRootCompatibilitySurface !== false ||
    rootRenderGateResult.summary
      .privatePromotion503533PublicRenderCompatibilityClaimed !== false ||
    rootRenderGateResult.summary
      .privatePromotion503533PublicRootRenderCompatibilityClaimed !== false ||
    rootRenderGateResult.summary
      .privatePromotion503533PublicHydrationCompatibilityClaimed !== false ||
    rootRenderGateResult.summary
      .privatePromotion503533PublicEventCompatibilityClaimed !== false ||
    rootRenderGateResult.summary
      .privatePromotion503533PublicResourceCompatibilityClaimed !== false ||
    rootRenderGateResult.summary
      .privatePromotion503533PublicFormCompatibilityClaimed !== false ||
    rootRenderGateResult.summary
      .privatePromotion503533PublicControlledInputCompatibilityClaimed !==
      false ||
    rootRenderGateResult.summary
      .privatePromotion503533PublicTestRendererCompatibilityClaimed !== false
  ) {
    failures.push({
      gateStatus:
        "root-render-private-promotion-503-533-claims-compatibility-while-public-facade-blocked",
      summaryClaim:
        rootRenderGateResult.summary.privatePromotion503533CompatibilityClaimed ??
        null,
      gateClaim:
        rootRenderGateResult.privatePromotion503533Gate
          ?.compatibilityClaimed ?? null,
      summaryPublicRootClaim:
        rootRenderGateResult.summary
          .privatePromotion503533PublicRootCompatibilitySurface ?? null,
      summaryPublicTestRendererClaim:
        rootRenderGateResult.summary
          .privatePromotion503533PublicTestRendererCompatibilityClaimed ?? null
    });
  }

  for (const claimKey of REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_CLAIM_KEYS) {
    if (rootRenderGateResult.privatePromotion503533Gate?.[claimKey] !== false) {
      failures.push({
        gateStatus:
          "root-render-private-promotion-503-533-gate-public-claim-leaked",
        claimKey,
        actual: rootRenderGateResult.privatePromotion503533Gate?.[claimKey]
      });
    }
  }

  if (
    findFirstDifferencePath(
      rootRenderGateResult.privatePromotion503533Gate
        ?.rejectedPrivateMetadataIds ?? [],
      expectedRowIds
    ) !== null ||
    findFirstDifferencePath(
      (rootRenderGateResult.privatePromotionRejectionRows503533 ?? []).map(
        (row) => row.workerId
      ),
      expectedWorkerIds
    ) !== null
  ) {
    failures.push({
      gateStatus:
        "root-render-private-promotion-503-533-rejection-set-mismatch",
      rejected:
        rootRenderGateResult.privatePromotion503533Gate
          ?.rejectedPrivateMetadataIds ?? null,
      workers: (
        rootRenderGateResult.privatePromotionRejectionRows503533 ?? []
      ).map((row) => row.workerId)
    });
  }

  for (const row of rootRenderGateResult.privatePromotionRejectionRows503533 ??
    []) {
    const publicClaimLeak =
      REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_CLAIM_KEYS.some(
        (claimKey) =>
          row[claimKey] !== false ||
          row.publicCompatibilityClaims?.[claimKey] !== false
      );

    if (
      row.gateStatus !==
        REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_REJECTED_STATUS ||
      row.admission !== "accepted-private-diagnostic" ||
      row.promotion !== "rejected" ||
      row.privateEvidenceOnly !== true ||
      row.comparedToReactDomOracle !== false ||
      row.comparedToReactTestRendererOracle !== false ||
      row.compatibilityClaimed !== false ||
      publicClaimLeak ||
      findFirstDifferencePath(
        row.blockedPublicCompatibilitySurfaces ?? [],
        REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_BLOCKED_SURFACES
      ) !== null ||
      !Array.isArray(row.acceptedPrivateMetadataIds) ||
      row.acceptedPrivateMetadataIds.length === 0
    ) {
      failures.push({
        workerId: row.workerId ?? null,
        gateStatus:
          "root-render-private-promotion-503-533-row-not-rejected",
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
        (comparison.status === "unsupported-placeholder" &&
          comparison.compatibilityClaimed === false &&
          comparison.firstDifferencePath !== null) ||
        isMinimalPublicCreateRootKnownMismatch({
          scenarioId,
          comparison
        })
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
  publicFacadeLifecycleRows,
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
    blockedPublicFacadeRows.push({
      id: "public-root-render",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      reason:
        "root.render is exposed only for the minimal div text host-output path; broad render compatibility remains blocked.",
      compatibilityClaimed: false,
      minimalDivTextHostOutputOnly: true
    });
    blockedPublicFacadeRows.push({
      id: "public-root-unmount",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      reason:
        "root.unmount is exposed only for cleanup after the minimal div text host-output path; broad unmount compatibility remains blocked.",
      compatibilityClaimed: false
    });
  }

  validatePublicRootLifecycleBlocked({
    publicRootLifecycle: localPublicFacadeBoundary.publicRootLifecycle,
    publicFacadeLifecycleRows,
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

  blockedPublicFacadeRows.push({
    id: "public-root-render-private-react-dom-metadata-compatibility",
    gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
    reason:
      "Private React DOM metadata rows remain separate from public root, hydration, event, resource, form, and controlled-input compatibility while public roots are placeholders.",
    compatibilityClaimed: false,
    privateReactDomMetadataEvidence: "separate"
  });

  blockedPublicFacadeRows.push({
    id: "public-root-work-loop-commit-handoff-compatibility",
    gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
    reason:
      "Private root work-loop and finished-work commit handoff diagnostics remain separate from public createRoot, render, update, unmount, hydrateRoot, DOM mutation, and test-renderer compatibility while public roots are placeholders.",
    compatibilityClaimed: false,
    privateRootWorkLoopCommitHandoffEvidence: "separate"
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
    blockedPublicFacadeRows.push({
      id: "public-event-dispatch",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateEventEvidence: "separate"
    });
    blockedPublicFacadeRows.push({
      id: "public-resource-hints",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateResourceEvidence: "separate"
    });
    blockedPublicFacadeRows.push({
      id: "public-form-actions",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateFormEvidence: "separate"
    });
    blockedPublicFacadeRows.push({
      id: "public-controlled-inputs",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      privateControlledInputEvidence: "separate"
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
    exportName === "createRoot" &&
    operation.status === "ok" &&
    operation.rootObjectCreated === true &&
    isRootFacadeSideEffectFree(operation.sideEffects)
  ) {
    blockedPublicFacadeRows.push({
      id: "public-create-root",
      gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
      compatibilityClaimed: false,
      exportName,
      minimalPublicRootObjectExposed: true,
      reason:
        "Public createRoot may return a minimal root object only for the div text host-output path; broad root compatibility remains blocked."
    });
    return;
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
  publicFacadeLifecycleRows,
  blockedPublicFacadeRows,
  failures
}) {
  if (!publicRootLifecycle || typeof publicRootLifecycle !== "object") {
    failures.push({
      gateStatus: "missing-public-root-lifecycle-boundary"
    });
    return;
  }

  const lifecycleRowSource = Array.isArray(publicFacadeLifecycleRows)
    ? publicFacadeLifecycleRows
    : [];
  const lifecycleRows = [
    {
      key: "renderInitial",
      expected: lifecycleRowSource[0],
      expectedId: "public-create-root-render-initial",
      expectedLabel: PUBLIC_ROOT_RENDER_INITIAL_API
    },
    {
      key: "renderDivText",
      expected: lifecycleRowSource[1],
      expectedId: "public-create-root-render-div-text",
      expectedLabel: MINIMAL_PUBLIC_DIV_TEXT_RENDER_API
    },
    {
      key: "renderUpdate",
      expected: lifecycleRowSource[2],
      expectedId: "public-create-root-render-update",
      expectedLabel: MINIMAL_PUBLIC_DIV_TEXT_UPDATE_API
    },
    {
      key: "renderIdRemoval",
      expected: lifecycleRowSource[3],
      expectedId: "public-create-root-render-id-removal",
      expectedLabel: MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL_API
    },
    {
      key: "unmount",
      expected: lifecycleRowSource[4],
      expectedId: "public-create-root-unmount-call",
      expectedLabel: MINIMAL_PUBLIC_DIV_TEXT_UNMOUNT_API
    }
  ];

  for (const { expected, expectedId, expectedLabel, key } of lifecycleRows) {
    if (
      !expected ||
      expected.id !== expectedId ||
      expected.publicApi !== expectedLabel
    ) {
      failures.push({
        gateStatus: "public-root-lifecycle-row-public-api-label-mismatch",
        id: expected?.id ?? expectedId,
        expectedId,
        publicApi: expected?.publicApi ?? null,
        expectedPublicApi: expectedLabel
      });
      continue;
    }

    const operation = publicRootLifecycle[key];
    if (!operation) {
      failures.push({
        gateStatus: "missing-public-root-lifecycle-operation",
        id: expected.id
      });
      continue;
    }

    if (
      expected.controlledDomShim === true &&
      operation.label === expectedLabel &&
      operation.status === "ok" &&
      operation.value?.type === "undefined" &&
      operation.createRootAttempt?.status === "ok" &&
      operation.lifecycleOperationAttempted === true &&
      operation.rootObjectCreated === true &&
      operation.compatibilityClaimed === false &&
      operation.controlledDomShim === true &&
      operation.renderElementType === "div" &&
      operation.renderTextContent ===
        getPublicRenderExpectedTextContent(expected) &&
      isPublicRenderControlledDomShimExpectedSnapshot(
        operation.controlledDomSnapshot,
        expected
      ) &&
      operation.sideEffects &&
      operation.sideEffects.containerMarker.propertyCount === 0 &&
      operation.sideEffects.containerListeningMarker.propertyCount === 0 &&
      operation.sideEffects.ownerDocumentListeningMarker.propertyCount === 0 &&
      operation.sideEffects.listenerRegistrationCount === 0 &&
      operation.sideEffects.ownerDocumentListenerRegistrationCount === 0 &&
      operation.sideEffects.ownerDocumentMutationCount === 0 &&
      getRootFacadeMutationCount(operation.sideEffects) ===
        expected.expectedMutationLog.length &&
      ((expected.minimalHostOutputAdmission !== "update" &&
        expected.minimalHostOutputAdmission !== "id-removal") ||
        operation.hostNodeReused === true) &&
      (expected.minimalHostOutputAdmission !== "unmount" ||
        operation.duplicateRootTrackingCleared === true)
    ) {
      blockedPublicFacadeRows.push({
        id: expected.id,
        gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
        compatibilityClaimed: false,
        controlledDomShim: true,
        controlledDomSnapshot: operation.controlledDomSnapshot,
        duplicateRootTrackingCleared:
          operation.duplicateRootTrackingCleared ?? false,
        hostNodeReused: operation.hostNodeReused ?? false,
        minimalDivTextHostOutputAdmitted:
          expected.minimalHostOutputAdmission === "render",
        minimalDivTextHostOutputUpdated:
          expected.minimalHostOutputAdmission === "update",
        minimalDivTextHostOutputIdRemoved:
          expected.minimalHostOutputAdmission === "id-removal",
        minimalDivTextHostOutputUnmounted:
          expected.minimalHostOutputAdmission === "unmount",
        minimalHostOutputAdmission: expected.minimalHostOutputAdmission,
        mutationCount: getRootFacadeMutationCount(operation.sideEffects),
        privateBridgeEvidence: "wrapped-private-facade-host-output",
        publicApi: expectedLabel,
        renderReturnType: operation.value.type,
        scenarioId: expected.scenarioId
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
      expected.controlledDomShim === true &&
      (operation.controlledDomShim !== true ||
        operation.renderElementType !== "div" ||
        operation.renderTextContent !==
          getPublicRenderExpectedTextContent(expected) ||
        !isPublicRenderControlledDomShimUntouched(
          operation.controlledDomSnapshot
        ))
    ) {
      failures.push({
        gateStatus: "public-root-render-controlled-dom-shim-not-blocked",
        id: expected.id,
        controlledDomShim: operation.controlledDomShim ?? null,
        controlledDomSnapshot: operation.controlledDomSnapshot ?? null,
        renderElementType: operation.renderElementType ?? null,
        renderTextContent: operation.renderTextContent ?? null
      });
      continue;
    }

    if (
      operation.label === expectedLabel &&
      operation.status === "throws" &&
      operation.thrown.code === "FAST_REACT_UNIMPLEMENTED" &&
      operation.thrown.entrypoint === "react-dom/client" &&
      (operation.thrown.exportName === "createRoot" ||
        operation.thrown.exportName === "createRoot().render" ||
        operation.thrown.exportName === "createRoot().unmount") &&
      (operation.blockedAt === "createRoot" || operation.blockedAt === null) &&
      (operation.createRootAttempt?.status === "throws" ||
        operation.createRootAttempt?.status === "ok") &&
      (operation.createRootAttempt?.status !== "throws" ||
        operation.createRootAttempt.thrown.code ===
          "FAST_REACT_UNIMPLEMENTED") &&
      (operation.lifecycleOperationAttempted === false ||
        operation.lifecycleOperationAttempted === true) &&
      (operation.rootObjectCreated === false ||
        operation.rootObjectCreated === true)
    ) {
      blockedPublicFacadeRows.push({
        id: expected.id,
        gateStatus: REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
        blockedAt:
          operation.blockedAt ??
          (operation.thrown.exportName === "createRoot().unmount"
            ? "root.unmount"
            : "root.render"),
        compatibilityClaimed: false,
        listenerRegistrationCount: getRootFacadeListenerRegistrationCount(
          operation.sideEffects
        ),
        mutationCount: getRootFacadeMutationCount(operation.sideEffects),
        controlledDomShim: operation.controlledDomShim ?? false,
        controlledDomSnapshot: operation.controlledDomSnapshot ?? null,
        privateBridgeEvidence: "separate",
        publicApi: expectedLabel,
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

function getPublicRenderExpectedTextContent(expected) {
  return expected.expectedRenderTextContent ?? expected.expectedTextContent;
}

function isPublicRenderControlledDomShimUntouched(snapshot) {
  return (
    snapshot &&
    snapshot.containerChildCount === 0 &&
    findFirstDifferencePath(snapshot.containerChildNodeNames, []) === null &&
    snapshot.containerChildrenCount === 0 &&
    snapshot.containerFirstElementChildAttributes === null &&
    snapshot.containerFirstElementChildGetAttributeId === null &&
    snapshot.containerFirstElementChildInnerHTML === null &&
    snapshot.containerFirstElementChildNodeName === null &&
    snapshot.containerFirstElementChildStoredPropsChildren === null &&
    snapshot.containerFirstElementChildStoredPropsHasId === null &&
    snapshot.containerFirstElementChildStoredPropsId === null &&
    snapshot.containerFirstElementChildStoredPropsSameObject === null &&
    snapshot.containerFirstElementChildTagName === null &&
    snapshot.containerFirstElementChildTextContent === null &&
    snapshot.containerInnerHTML === "" &&
    findFirstDifferencePath(snapshot.containerMutationLog, []) === null &&
    snapshot.containerTextContent === "" &&
    snapshot.ownerDocumentChildCount === 0 &&
    findFirstDifferencePath(snapshot.ownerDocumentMutationLog, []) === null
  );
}

function isPublicRenderControlledDomShimExpectedSnapshot(snapshot, expected) {
  return (
    snapshot &&
    snapshot.containerChildCount === expected.expectedChildNodeNames.length &&
    findFirstDifferencePath(
      snapshot.containerChildNodeNames,
      expected.expectedChildNodeNames
    ) === null &&
    snapshot.containerChildrenCount === expected.expectedChildrenCount &&
    findFirstDifferencePath(
      snapshot.containerFirstElementChildAttributes,
      expected.expectedFirstElementChildAttributes
    ) === null &&
    snapshot.containerFirstElementChildGetAttributeId ===
      expected.expectedFirstElementChildGetAttributeId &&
    snapshot.containerFirstElementChildInnerHTML ===
      expected.expectedFirstElementChildInnerHTML &&
    snapshot.containerFirstElementChildNodeName ===
      expected.expectedFirstElementChildNodeName &&
    snapshot.containerFirstElementChildStoredPropsChildren ===
      expected.expectedFirstElementChildStoredPropsChildren &&
    snapshot.containerFirstElementChildStoredPropsHasId ===
      expected.expectedFirstElementChildStoredPropsHasId &&
    snapshot.containerFirstElementChildStoredPropsId ===
      expected.expectedFirstElementChildStoredPropsId &&
    snapshot.containerFirstElementChildStoredPropsSameObject ===
      expected.expectedFirstElementChildStoredPropsSameObject &&
    snapshot.containerFirstElementChildTagName ===
      expected.expectedFirstElementChildTagName &&
    snapshot.containerFirstElementChildTextContent ===
      expected.expectedFirstElementChildTextContent &&
    snapshot.containerInnerHTML === expected.expectedInnerHTML &&
    findFirstDifferencePath(
      snapshot.containerMutationLog,
      expected.expectedMutationLog
    ) === null &&
    snapshot.containerTextContent === expected.expectedTextContent &&
    snapshot.ownerDocumentChildCount === 0 &&
    findFirstDifferencePath(snapshot.ownerDocumentMutationLog, []) === null
  );
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
  componentTree,
  domContainer,
  listenerRegistry,
  React,
  reactDomClient,
  rootMarkers
}) {
  return {
    renderInitial: attemptChainedPublicRootOperation({
      domContainer,
      label: PUBLIC_ROOT_RENDER_INITIAL_API,
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
    renderDivText: attemptControlledPublicRootRenderDivTextOperation({
      componentTree,
      domContainer,
      label: MINIMAL_PUBLIC_DIV_TEXT_RENDER_API,
      listenerRegistry,
      React,
      reactDomClient,
      rootMarkers
    }),
    renderUpdate: attemptControlledPublicRootRenderUpdateOperation({
      componentTree,
      domContainer,
      label: MINIMAL_PUBLIC_DIV_TEXT_UPDATE_API,
      listenerRegistry,
      React,
      reactDomClient,
      rootMarkers
    }),
    renderIdRemoval: attemptControlledPublicRootRenderIdRemovalOperation({
      componentTree,
      domContainer,
      label: MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL_API,
      listenerRegistry,
      React,
      reactDomClient,
      rootMarkers
    }),
    unmount: attemptControlledPublicRootUnmountOperation({
      componentTree,
      domContainer,
      label: MINIMAL_PUBLIC_DIV_TEXT_UNMOUNT_API,
      listenerRegistry,
      React,
      reactDomClient,
      rootMarkers
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

function attemptControlledPublicRootRenderDivTextOperation({
  componentTree,
  domContainer,
  label,
  listenerRegistry,
  React,
  reactDomClient,
  rootMarkers
}) {
  const { container, ownerDocument } = createPublicRenderControlledDomShim({
    domContainer,
    label
  });
  let createRootAttempt = null;
  let expectedLatestProps = null;
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
    const element = React.createElement(
      "div",
      { id: MINIMAL_PUBLIC_DIV_TEXT_ID },
      MINIMAL_PUBLIC_DIV_TEXT
    );
    expectedLatestProps = element.props;
    return root.render(element);
  });

  return {
    ...result,
    blockedAt: createRootAttempt?.status === "throws" ? "createRoot" : null,
    compatibilityClaimed: false,
    controlledDomShim: true,
    controlledDomSnapshot: summarizePublicRenderControlledDomShim({
      componentTree,
      container,
      expectedLatestProps,
      ownerDocument
    }),
    createRootAttempt,
    lifecycleOperationAttempted,
    renderElementType: "div",
    renderTextContent: MINIMAL_PUBLIC_DIV_TEXT,
    rootObjectCreated,
    sideEffects: inspectRootFacadeSideEffects(
      container,
      ownerDocument,
      rootMarkers,
      listenerRegistry
    )
  };
}

function attemptControlledPublicRootRenderUpdateOperation({
  componentTree,
  domContainer,
  label,
  listenerRegistry,
  React,
  reactDomClient,
  rootMarkers
}) {
  const { container, ownerDocument } = createPublicRenderControlledDomShim({
    domContainer,
    label
  });
  let createRootAttempt = null;
  let expectedLatestProps = null;
  let hostNodeReused = false;
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
    const initialElement = React.createElement(
      "div",
      { id: MINIMAL_PUBLIC_DIV_TEXT_ID },
      MINIMAL_PUBLIC_DIV_TEXT
    );
    root.render(initialElement);
    const initialHostNode = container.firstChild;
    const updateElement = React.createElement(
      "div",
      { id: MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID },
      MINIMAL_PUBLIC_DIV_TEXT_UPDATE
    );
    expectedLatestProps = updateElement.props;
    const value = root.render(updateElement);
    hostNodeReused =
      initialHostNode !== null && container.firstChild === initialHostNode;
    return value;
  });

  return {
    ...result,
    blockedAt: createRootAttempt?.status === "throws" ? "createRoot" : null,
    compatibilityClaimed: false,
    controlledDomShim: true,
    controlledDomSnapshot: summarizePublicRenderControlledDomShim({
      componentTree,
      container,
      expectedLatestProps,
      ownerDocument
    }),
    createRootAttempt,
    hostNodeReused,
    lifecycleOperationAttempted,
    renderElementType: "div",
    renderTextContent: MINIMAL_PUBLIC_DIV_TEXT_UPDATE,
    rootObjectCreated,
    sideEffects: inspectRootFacadeSideEffects(
      container,
      ownerDocument,
      rootMarkers,
      listenerRegistry
    )
  };
}

function attemptControlledPublicRootRenderIdRemovalOperation({
  componentTree,
  domContainer,
  label,
  listenerRegistry,
  React,
  reactDomClient,
  rootMarkers
}) {
  const { container, ownerDocument } = createPublicRenderControlledDomShim({
    domContainer,
    label
  });
  let createRootAttempt = null;
  let expectedLatestProps = null;
  let hostNodeReused = false;
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
    const initialElement = React.createElement(
      "div",
      { id: MINIMAL_PUBLIC_DIV_TEXT_ID },
      MINIMAL_PUBLIC_DIV_TEXT
    );
    root.render(initialElement);
    const initialHostNode = container.firstChild;
    const updateElement = React.createElement(
      "div",
      { id: MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID },
      MINIMAL_PUBLIC_DIV_TEXT_UPDATE
    );
    root.render(updateElement);
    const removalElement = React.createElement(
      "div",
      null,
      MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL
    );
    expectedLatestProps = removalElement.props;
    const value = root.render(removalElement);
    hostNodeReused =
      initialHostNode !== null && container.firstChild === initialHostNode;
    return value;
  });

  return {
    ...result,
    blockedAt: createRootAttempt?.status === "throws" ? "createRoot" : null,
    compatibilityClaimed: false,
    controlledDomShim: true,
    controlledDomSnapshot: summarizePublicRenderControlledDomShim({
      componentTree,
      container,
      expectedLatestProps,
      ownerDocument
    }),
    createRootAttempt,
    hostNodeReused,
    lifecycleOperationAttempted,
    renderElementType: "div",
    renderTextContent: MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL,
    rootObjectCreated,
    sideEffects: inspectRootFacadeSideEffects(
      container,
      ownerDocument,
      rootMarkers,
      listenerRegistry
    )
  };
}

function attemptControlledPublicRootUnmountOperation({
  componentTree,
  domContainer,
  label,
  listenerRegistry,
  React,
  reactDomClient,
  rootMarkers
}) {
  const { container, ownerDocument } = createPublicRenderControlledDomShim({
    domContainer,
    label
  });
  let createRootAttempt = null;
  let duplicateRootTrackingCleared = false;
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
    root.render(
      React.createElement(
        "div",
        { id: MINIMAL_PUBLIC_DIV_TEXT_ID },
        MINIMAL_PUBLIC_DIV_TEXT
      )
    );
    const value = root.unmount();
    try {
      reactDomClient.createRoot(container);
      duplicateRootTrackingCleared = true;
    } catch {
      duplicateRootTrackingCleared = false;
    }
    return value;
  });

  return {
    ...result,
    blockedAt: createRootAttempt?.status === "throws" ? "createRoot" : null,
    compatibilityClaimed: false,
    controlledDomShim: true,
    controlledDomSnapshot: summarizePublicRenderControlledDomShim({
      componentTree,
      container,
      expectedLatestProps: null,
      ownerDocument
    }),
    createRootAttempt,
    duplicateRootTrackingCleared,
    lifecycleOperationAttempted,
    renderElementType: "div",
    renderTextContent: MINIMAL_PUBLIC_DIV_TEXT,
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

function createPublicRenderControlledDomShim({ domContainer, label }) {
  const ownerDocument = new PrivateHostOutputDocument({
    documentNodeType: domContainer.DOCUMENT_NODE,
    elementNodeType: domContainer.ELEMENT_NODE,
    label,
    textNodeType: domContainer.TEXT_NODE
  });
  const container = ownerDocument.createElement("div");

  return {
    container,
    ownerDocument
  };
}

function summarizePublicRenderControlledDomShim({
  componentTree,
  container,
  expectedLatestProps,
  ownerDocument
}) {
  const firstElementChild = container.firstElementChild;
  const latestProps =
    firstElementChild === null ||
    componentTree === null ||
    componentTree === undefined ||
    typeof componentTree.getLatestPropsFromNode !== "function"
      ? null
      : componentTree.getLatestPropsFromNode(firstElementChild);
  const latestPropsObject =
    latestProps !== null && typeof latestProps === "object"
      ? latestProps
      : null;
  const latestPropsHasId =
    firstElementChild === null || latestPropsObject === null
      ? null
      : Object.prototype.hasOwnProperty.call(latestPropsObject, "id");
  return {
    containerChildCount: container.childNodes.length,
    containerChildNodeNames: summarizeChildNodeNames(container),
    containerChildrenCount: container.children.length,
    containerFirstElementChildAttributes:
      firstElementChild === null ? null : attributeEntries(firstElementChild),
    containerFirstElementChildGetAttributeId:
      firstElementChild === null ? null : firstElementChild.getAttribute("id"),
    containerFirstElementChildInnerHTML:
      firstElementChild === null ? null : firstElementChild.innerHTML,
    containerFirstElementChildNodeName:
      firstElementChild === null ? null : firstElementChild.nodeName,
    containerFirstElementChildStoredPropsChildren:
      latestPropsObject === null ||
      !Object.prototype.hasOwnProperty.call(latestPropsObject, "children")
        ? null
        : latestPropsObject.children,
    containerFirstElementChildStoredPropsHasId: latestPropsHasId,
    containerFirstElementChildStoredPropsId:
      latestPropsHasId === true ? latestPropsObject.id : null,
    containerFirstElementChildStoredPropsSameObject:
      firstElementChild === null ? null : latestProps === expectedLatestProps,
    containerFirstElementChildTagName:
      firstElementChild === null ? null : firstElementChild.tagName,
    containerFirstElementChildTextContent:
      firstElementChild === null ? null : firstElementChild.textContent,
    containerInnerHTML: container.innerHTML,
    containerMutationLog: container.mutationLog.slice(),
    containerTextContent: container.textContent,
    ownerDocumentChildCount: ownerDocument.childNodes.length,
    ownerDocumentMutationLog: ownerDocument.mutationLog.slice()
  };
}

function attributeEntries(node) {
  if (!(node.attributes instanceof Map)) {
    return null;
  }
  return [...node.attributes.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  );
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
function summarizeChildNodeNames(parent) {
  return parent.childNodes.map((child) => child.nodeName);
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

  get children() {
    return this.childNodes.filter(
      (child) => child.nodeType === this.ownerDocument?.elementNodeType
    );
  }

  get firstElementChild() {
    return this.children[0] ?? null;
  }

  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] ?? null;
  }

  get innerHTML() {
    if (this.childNodes.length > 0) {
      return this.childNodes.map(serializePrivateHostOutputNode).join("");
    }
    return escapePrivateHostOutputText(this.textContent);
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
    this.tagName = fields.nodeName;
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

function serializePrivateHostOutputNode(node) {
  if (node instanceof PrivateHostOutputText) {
    return escapePrivateHostOutputText(node.textContent);
  }
  if (node instanceof PrivateHostOutputElement) {
    const tagName = String(node.nodeName).toLowerCase();
    return `<${tagName}${serializePrivateHostOutputAttributes(node)}>${node.innerHTML}</${tagName}>`;
  }
  return "";
}

function serializePrivateHostOutputAttributes(node) {
  if (!(node.attributes instanceof Map) || node.attributes.size === 0) {
    return "";
  }
  return [...node.attributes.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([name, value]) =>
        ` ${name}="${escapePrivateHostOutputAttributeValue(value)}"`
    )
    .join("");
}

function escapePrivateHostOutputText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapePrivateHostOutputAttributeValue(value) {
  return escapePrivateHostOutputText(value).replaceAll('"', "&quot;");
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
function findComparison({ oracle, modeId, scenarioId }) {
  return (
    oracle.fastReactComparisons?.[modeId]?.find(
      (comparison) => comparison.scenarioId === scenarioId
    ) ?? null
  );
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
      : failure.modeId && failure.metadataId
        ? `${failure.modeId}:${failure.metadataId}`
      : "gate";
  const details = Object.entries(failure)
    .filter(
      ([key]) =>
        !["metadataId", "modeId", "scenarioId", "gateStatus"].includes(key)
    )
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(" ");
  return details
    ? `${location} ${failure.gateStatus} ${details}`
    : `${location} ${failure.gateStatus}`;
}
