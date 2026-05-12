import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  readCheckedReactDomClientRootOracle
} from "../src/react-dom-client-root-oracle.mjs";
import {
  REACT_DOM_CLIENT_ROOT_PROBE_MODES
} from "../src/react-dom-client-root-targets.mjs";
import {
  readCheckedReactDomRootRenderE2EOracle
} from "../src/react-dom-root-render-e2e-oracle.mjs";
import {
  REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES
} from "../src/react-dom-root-render-e2e-targets.mjs";
import {
  REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS
} from "../src/react-dom-root-render-e2e-scenarios.mjs";
import {
  REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_BOUNDARY_ROWS,
  REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
  REACT_DOM_ROOT_PUBLIC_FACADE_BRIDGE_RECORD_ONLY_STATUS,
  REACT_DOM_ROOT_PUBLIC_FACADE_CAPABILITY_REJECTION_ROWS,
  REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS,
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_BLOCKED_SURFACES,
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_CLAIM_KEYS,
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_REJECTED_STATUS,
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS,
  REACT_DOM_ROOT_PUBLIC_FACADE_SCENARIO_ADMISSIONS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ADMISSIONS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ADMISSIONS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_ACCEPTED_STATUS,
  evaluateReactDomRootRenderE2EConformanceGate,
  evaluateReactDomRootPublicFacadeBlockedGate,
  inspectReactDomPrivateRootBridgeBoundary,
  inspectReactDomRootPublicFacadeBoundary
} from "../src/react-dom-root-render-e2e-conformance-gate.mjs";

const rootRenderOracle = readCheckedReactDomRootRenderE2EOracle();
const clientRootOracle = readCheckedReactDomClientRootOracle();
const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const hydrateRootAcceptedPrivateMetadataBlockedPublicFields = Object.freeze([
  "compatibilityClaimed",
  "publicRootCompatibilitySurface",
  "publicRootRenderCompatibilityClaimed",
  "publicHydrationCompatibilityClaimed",
  "publicHydrationReplayCompatibilityClaimed",
  "publicEventCompatibilityClaimed",
  "publicResourceCompatibilityClaimed",
  "publicResourceDomInsertionCompatibilityClaimed",
  "publicStylesheetCompatibilityClaimed",
  "publicFormCompatibilityClaimed",
  "publicFormActionCompatibilityClaimed",
  "publicFormResetCompatibilityClaimed",
  "publicControlledInputCompatibilityClaimed"
]);
const hydrateRootAcceptedPrivateMetadataRowBlockedPublicFields = Object.freeze([
  "compatibilityClaimed",
  "publicCompatibilityClaimed",
  "publicRootRenderCompatibilityClaimed",
  "publicHydrationCompatibilityClaimed",
  "publicResourceCompatibilityClaimed",
  "publicFormCompatibilityClaimed",
  "promotesHydration",
  "promotesRootRender"
]);
const hydrateRootLifecycleBoundaryBlockedFields = Object.freeze([
  "publicHydrateRootEnabled",
  "publicHydrateRootSupported",
  "publicRootCreated",
  "publicRootExecution",
  "publicRootObjectExposed",
  "publicRootCompatibilitySurface",
  "canHydrate",
  "containerMarked",
  "listenersAttached",
  "domMutated",
  "browserDomMutated",
  "rootScheduled",
  "suspenseHydrationScheduled",
  "nativeExecution",
  "reconcilerExecution",
  "domMutation",
  "markerWrites",
  "listenerInstallation",
  "hydration",
  "eventDispatch",
  "compatibilityClaimed",
  "publicHydrationCompatibilityClaimed",
  "publicHydrationReplayCompatibilityClaimed"
]);

const MINIMAL_PUBLIC_DIV_TEXT_ID = 'app&<>"';
const MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID = 'next&<>"';
const MINIMAL_PUBLIC_DIV_TEXT = "hello & < >";
const MINIMAL_PUBLIC_DIV_TEXT_ESCAPED = "hello &amp; &lt; &gt;";
const MINIMAL_PUBLIC_DIV_TEXT_UPDATE = "again & < >";
const MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ESCAPED = "again &amp; &lt; &gt;";
const MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL = "id removed & < >";
const MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL_ESCAPED =
  "id removed &amp; &lt; &gt;";
const MINIMAL_PUBLIC_DIV_TEXT_ID_ESCAPED = "app&amp;&lt;&gt;&quot;";
const MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID_ESCAPED = "next&amp;&lt;&gt;&quot;";
const SIMPLE_PUBLIC_DIV_TEXT_API =
  'ReactDOMClient.createRoot(container).render(React.createElement("div", { id: "app" }, "text"))';

function minimalPublicDivTextApi(text, id = MINIMAL_PUBLIC_DIV_TEXT_ID) {
  const props =
    id === null ? "null" : `{ id: ${JSON.stringify(id)} }`;
  return `ReactDOMClient.createRoot(container).render(React.createElement("div", ${props}, ${JSON.stringify(text)}))`;
}

function rootRenderMinimalPublicDivTextApi(rootName, text) {
  return `${rootName}.render(React.createElement("div", { id: ${JSON.stringify(MINIMAL_PUBLIC_DIV_TEXT_ID)} }, ${JSON.stringify(text)}))`;
}

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
const MINIMAL_PUBLIC_DIV_TEXT_RECREATE_AFTER_UNMOUNT_API = [
  "const root = ReactDOMClient.createRoot(container)",
  rootRenderMinimalPublicDivTextApi("root", MINIMAL_PUBLIC_DIV_TEXT),
  rootRenderMinimalPublicDivTextApi("root", MINIMAL_PUBLIC_DIV_TEXT_UPDATE),
  "root.unmount()",
  "const freshRoot = ReactDOMClient.createRoot(container)",
  rootRenderMinimalPublicDivTextApi("freshRoot", MINIMAL_PUBLIC_DIV_TEXT),
  "freshRoot.unmount()"
].join("; ");

const MINIMAL_PUBLIC_DIV_TEXT_SNAPSHOT = Object.freeze({
  containerChildCount: 1,
  containerChildNodeNames: Object.freeze(["DIV"]),
  containerChildrenCount: 1,
  containerFirstElementChildAttributes: Object.freeze([
    Object.freeze(["id", MINIMAL_PUBLIC_DIV_TEXT_ID])
  ]),
  containerFirstElementChildGetAttributeId: MINIMAL_PUBLIC_DIV_TEXT_ID,
  containerFirstElementChildInnerHTML: MINIMAL_PUBLIC_DIV_TEXT_ESCAPED,
  containerFirstElementChildNodeName: "DIV",
  containerFirstElementChildStoredPropsChildren: MINIMAL_PUBLIC_DIV_TEXT,
  containerFirstElementChildStoredPropsHasId: true,
  containerFirstElementChildStoredPropsId: MINIMAL_PUBLIC_DIV_TEXT_ID,
  containerFirstElementChildStoredPropsSameObject: true,
  containerFirstElementChildTagName: "DIV",
  containerFirstElementChildTextContent: MINIMAL_PUBLIC_DIV_TEXT,
  containerInnerHTML: `<div id="${MINIMAL_PUBLIC_DIV_TEXT_ID_ESCAPED}">${MINIMAL_PUBLIC_DIV_TEXT_ESCAPED}</div>`,
  containerMutationLog: Object.freeze([Object.freeze(["appendChild", "DIV"])]),
  containerTextContent: MINIMAL_PUBLIC_DIV_TEXT,
  ownerDocumentChildCount: 0,
  ownerDocumentMutationLog: Object.freeze([])
});
const MINIMAL_PUBLIC_DIV_TEXT_UPDATE_SNAPSHOT = Object.freeze({
  containerChildCount: 1,
  containerChildNodeNames: Object.freeze(["DIV"]),
  containerChildrenCount: 1,
  containerFirstElementChildAttributes: Object.freeze([
    Object.freeze(["id", MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID])
  ]),
  containerFirstElementChildGetAttributeId: MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID,
  containerFirstElementChildInnerHTML: MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ESCAPED,
  containerFirstElementChildNodeName: "DIV",
  containerFirstElementChildStoredPropsChildren:
    MINIMAL_PUBLIC_DIV_TEXT_UPDATE,
  containerFirstElementChildStoredPropsHasId: true,
  containerFirstElementChildStoredPropsId: MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID,
  containerFirstElementChildStoredPropsSameObject: true,
  containerFirstElementChildTagName: "DIV",
  containerFirstElementChildTextContent: MINIMAL_PUBLIC_DIV_TEXT_UPDATE,
  containerInnerHTML: `<div id="${MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID_ESCAPED}">${MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ESCAPED}</div>`,
  containerMutationLog: Object.freeze([Object.freeze(["appendChild", "DIV"])]),
  containerTextContent: MINIMAL_PUBLIC_DIV_TEXT_UPDATE,
  ownerDocumentChildCount: 0,
  ownerDocumentMutationLog: Object.freeze([])
});
const MINIMAL_PUBLIC_DIV_TEXT_REPEAT_RENDER_SNAPSHOT = Object.freeze({
  containerChildCount: 1,
  containerChildNodeNames: Object.freeze(["DIV"]),
  containerChildrenCount: 1,
  containerFirstElementChildAttributes: Object.freeze([
    Object.freeze(["id", MINIMAL_PUBLIC_DIV_TEXT_ID])
  ]),
  containerFirstElementChildGetAttributeId: MINIMAL_PUBLIC_DIV_TEXT_ID,
  containerFirstElementChildInnerHTML: MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ESCAPED,
  containerFirstElementChildNodeName: "DIV",
  containerFirstElementChildStoredPropsChildren:
    MINIMAL_PUBLIC_DIV_TEXT_UPDATE,
  containerFirstElementChildStoredPropsHasId: true,
  containerFirstElementChildStoredPropsId: MINIMAL_PUBLIC_DIV_TEXT_ID,
  containerFirstElementChildStoredPropsSameObject: true,
  containerFirstElementChildTagName: "DIV",
  containerFirstElementChildTextContent: MINIMAL_PUBLIC_DIV_TEXT_UPDATE,
  containerInnerHTML: `<div id="${MINIMAL_PUBLIC_DIV_TEXT_ID_ESCAPED}">${MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ESCAPED}</div>`,
  containerMutationLog: Object.freeze([Object.freeze(["appendChild", "DIV"])]),
  containerTextContent: MINIMAL_PUBLIC_DIV_TEXT_UPDATE,
  ownerDocumentChildCount: 0,
  ownerDocumentMutationLog: Object.freeze([])
});
const MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL_SNAPSHOT = Object.freeze({
  containerChildCount: 1,
  containerChildNodeNames: Object.freeze(["DIV"]),
  containerChildrenCount: 1,
  containerFirstElementChildAttributes: Object.freeze([]),
  containerFirstElementChildGetAttributeId: null,
  containerFirstElementChildInnerHTML:
    MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL_ESCAPED,
  containerFirstElementChildNodeName: "DIV",
  containerFirstElementChildStoredPropsChildren:
    MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL,
  containerFirstElementChildStoredPropsHasId: false,
  containerFirstElementChildStoredPropsId: null,
  containerFirstElementChildStoredPropsSameObject: true,
  containerFirstElementChildTagName: "DIV",
  containerFirstElementChildTextContent: MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL,
  containerInnerHTML: `<div>${MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL_ESCAPED}</div>`,
  containerMutationLog: Object.freeze([Object.freeze(["appendChild", "DIV"])]),
  containerTextContent: MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL,
  ownerDocumentChildCount: 0,
  ownerDocumentMutationLog: Object.freeze([])
});
const MINIMAL_PUBLIC_DIV_TEXT_UNMOUNT_SNAPSHOT = Object.freeze({
  containerChildCount: 0,
  containerChildNodeNames: Object.freeze([]),
  containerChildrenCount: 0,
  containerFirstElementChildAttributes: null,
  containerFirstElementChildGetAttributeId: null,
  containerFirstElementChildInnerHTML: null,
  containerFirstElementChildNodeName: null,
  containerFirstElementChildStoredPropsChildren: null,
  containerFirstElementChildStoredPropsHasId: null,
  containerFirstElementChildStoredPropsId: null,
  containerFirstElementChildStoredPropsSameObject: null,
  containerFirstElementChildTagName: null,
  containerFirstElementChildTextContent: null,
  containerInnerHTML: "",
  containerMutationLog: Object.freeze([
    Object.freeze(["appendChild", "DIV"]),
    Object.freeze(["removeChild", "DIV"])
  ]),
  containerTextContent: "",
  ownerDocumentChildCount: 0,
  ownerDocumentMutationLog: Object.freeze([])
});
const MINIMAL_PUBLIC_DIV_TEXT_RECREATE_RENDER_SNAPSHOT = Object.freeze({
  containerChildCount: 1,
  containerChildNodeNames: Object.freeze(["DIV"]),
  containerChildrenCount: 1,
  containerFirstElementChildAttributes: Object.freeze([
    Object.freeze(["id", MINIMAL_PUBLIC_DIV_TEXT_ID])
  ]),
  containerFirstElementChildGetAttributeId: MINIMAL_PUBLIC_DIV_TEXT_ID,
  containerFirstElementChildInnerHTML: MINIMAL_PUBLIC_DIV_TEXT_ESCAPED,
  containerFirstElementChildNodeName: "DIV",
  containerFirstElementChildStoredPropsChildren: MINIMAL_PUBLIC_DIV_TEXT,
  containerFirstElementChildStoredPropsHasId: true,
  containerFirstElementChildStoredPropsId: MINIMAL_PUBLIC_DIV_TEXT_ID,
  containerFirstElementChildStoredPropsSameObject: true,
  containerFirstElementChildTagName: "DIV",
  containerFirstElementChildTextContent: MINIMAL_PUBLIC_DIV_TEXT,
  containerInnerHTML: `<div id="${MINIMAL_PUBLIC_DIV_TEXT_ID_ESCAPED}">${MINIMAL_PUBLIC_DIV_TEXT_ESCAPED}</div>`,
  containerMutationLog: Object.freeze([
    Object.freeze(["appendChild", "DIV"]),
    Object.freeze(["removeChild", "DIV"]),
    Object.freeze(["appendChild", "DIV"])
  ]),
  containerTextContent: MINIMAL_PUBLIC_DIV_TEXT,
  ownerDocumentChildCount: 0,
  ownerDocumentMutationLog: Object.freeze([])
});
const MINIMAL_PUBLIC_DIV_TEXT_RECREATE_UNMOUNT_SNAPSHOT = Object.freeze({
  containerChildCount: 0,
  containerChildNodeNames: Object.freeze([]),
  containerChildrenCount: 0,
  containerFirstElementChildAttributes: null,
  containerFirstElementChildGetAttributeId: null,
  containerFirstElementChildInnerHTML: null,
  containerFirstElementChildNodeName: null,
  containerFirstElementChildStoredPropsChildren: null,
  containerFirstElementChildStoredPropsHasId: null,
  containerFirstElementChildStoredPropsId: null,
  containerFirstElementChildStoredPropsSameObject: null,
  containerFirstElementChildTagName: null,
  containerFirstElementChildTextContent: null,
  containerInnerHTML: "",
  containerMutationLog: Object.freeze([
    Object.freeze(["appendChild", "DIV"]),
    Object.freeze(["removeChild", "DIV"]),
    Object.freeze(["appendChild", "DIV"]),
    Object.freeze(["removeChild", "DIV"])
  ]),
  containerTextContent: "",
  ownerDocumentChildCount: 0,
  ownerDocumentMutationLog: Object.freeze([])
});

function assertPublicRootFacadeSideEffectFree(sideEffects) {
  assert.equal(sideEffects.mutationCount, 0);
  assert.equal(sideEffects.listenerRegistrationCount, 0);
  assert.equal(sideEffects.ownerDocumentListenerRegistrationCount, 0);
  assert.equal(sideEffects.ownerDocumentMutationCount, 0);
  assert.equal(sideEffects.containerMarker.propertyCount, 0);
  assert.equal(sideEffects.containerListeningMarker.propertyCount, 0);
  assert.equal(sideEffects.ownerDocumentListeningMarker.propertyCount, 0);
}

function assertMinimalPublicCreateRootBoundary(publicBoundary) {
  assert.equal(publicBoundary.createRoot.status, "ok");
  assert.deepEqual(publicBoundary.createRoot.value, {
    keys: ["render", "unmount"],
    type: "object"
  });
  assert.equal(publicBoundary.createRoot.rootObjectCreated, true);
  assertPublicRootFacadeSideEffectFree(publicBoundary.createRoot.sideEffects);
}

function assertBlockedPublicHydrateRootBoundary(publicBoundary) {
  assert.equal(publicBoundary.hydrateRoot.status, "throws");
  assert.equal(
    publicBoundary.hydrateRoot.thrown.code,
    "FAST_REACT_UNIMPLEMENTED"
  );
  assert.equal(publicBoundary.hydrateRoot.rootObjectCreated, false);
  assert.equal(publicBoundary.hydrateRoot.thrown.exportName, "hydrateRoot");
  assert.equal(publicBoundary.hydrateRoot.thrown.entrypoint, "react-dom/client");
  assertPublicRootFacadeSideEffectFree(publicBoundary.hydrateRoot.sideEffects);
}

function assertMinimalPublicDivTextLifecycle(publicBoundary) {
  const renderDivText = publicBoundary.publicRootLifecycle.renderDivText;
  assert.equal(
    renderDivText.label,
    MINIMAL_PUBLIC_DIV_TEXT_RENDER_API
  );
  assert.equal(renderDivText.status, "ok");
  assert.equal(renderDivText.value.type, "undefined");
  assert.equal(renderDivText.compatibilityClaimed, false);
  assert.equal(renderDivText.controlledDomShim, true);
  assert.equal(renderDivText.renderElementType, "div");
  assert.equal(renderDivText.renderTextContent, MINIMAL_PUBLIC_DIV_TEXT);
  assert.equal(renderDivText.rootObjectCreated, true);
  assert.equal(renderDivText.lifecycleOperationAttempted, true);
  assert.equal(renderDivText.createRootAttempt.status, "ok");
  assert.deepEqual(
    renderDivText.controlledDomSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_SNAPSHOT
  );
  assert.equal(renderDivText.sideEffects.mutationCount, 1);
  assert.equal(renderDivText.sideEffects.listenerRegistrationCount, 0);
  assert.equal(
    renderDivText.sideEffects.ownerDocumentListenerRegistrationCount,
    0
  );
  assert.equal(renderDivText.sideEffects.ownerDocumentMutationCount, 0);
  assert.equal(renderDivText.sideEffects.containerMarker.propertyCount, 0);
  assert.equal(
    renderDivText.sideEffects.containerListeningMarker.propertyCount,
    0
  );
  assert.equal(
    renderDivText.sideEffects.ownerDocumentListeningMarker.propertyCount,
    0
  );
}

function assertMinimalPublicDivTextUpdateLifecycle(publicBoundary) {
  const renderUpdate = publicBoundary.publicRootLifecycle.renderUpdate;
  assert.equal(
    renderUpdate.label,
    MINIMAL_PUBLIC_DIV_TEXT_UPDATE_API
  );
  assert.equal(renderUpdate.status, "ok");
  assert.equal(renderUpdate.value.type, "undefined");
  assert.equal(renderUpdate.compatibilityClaimed, false);
  assert.equal(renderUpdate.controlledDomShim, true);
  assert.equal(renderUpdate.renderElementType, "div");
  assert.equal(
    renderUpdate.renderTextContent,
    MINIMAL_PUBLIC_DIV_TEXT_UPDATE
  );
  assert.equal(renderUpdate.hostNodeReused, true);
  assert.equal(renderUpdate.rootObjectCreated, true);
  assert.equal(renderUpdate.lifecycleOperationAttempted, true);
  assert.equal(renderUpdate.createRootAttempt.status, "ok");
  assert.deepEqual(
    renderUpdate.controlledDomSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_UPDATE_SNAPSHOT
  );
  assert.equal(renderUpdate.sideEffects.mutationCount, 1);
  assert.equal(renderUpdate.sideEffects.listenerRegistrationCount, 0);
  assert.equal(
    renderUpdate.sideEffects.ownerDocumentListenerRegistrationCount,
    0
  );
  assert.equal(renderUpdate.sideEffects.ownerDocumentMutationCount, 0);
  assert.equal(renderUpdate.sideEffects.containerMarker.propertyCount, 0);
  assert.equal(
    renderUpdate.sideEffects.containerListeningMarker.propertyCount,
    0
  );
  assert.equal(
    renderUpdate.sideEffects.ownerDocumentListeningMarker.propertyCount,
    0
  );
}

function assertMinimalPublicDivTextIdRemovalLifecycle(publicBoundary) {
  const renderIdRemoval =
    publicBoundary.publicRootLifecycle.renderIdRemoval;
  assert.equal(
    renderIdRemoval.label,
    MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL_API
  );
  assert.equal(renderIdRemoval.status, "ok");
  assert.equal(renderIdRemoval.value.type, "undefined");
  assert.equal(renderIdRemoval.compatibilityClaimed, false);
  assert.equal(renderIdRemoval.controlledDomShim, true);
  assert.equal(renderIdRemoval.renderElementType, "div");
  assert.equal(
    renderIdRemoval.renderTextContent,
    MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL
  );
  assert.equal(renderIdRemoval.hostNodeReused, true);
  assert.equal(renderIdRemoval.rootObjectCreated, true);
  assert.equal(renderIdRemoval.lifecycleOperationAttempted, true);
  assert.equal(renderIdRemoval.createRootAttempt.status, "ok");
  assert.deepEqual(
    renderIdRemoval.controlledDomSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL_SNAPSHOT
  );
  assert.equal(renderIdRemoval.sideEffects.mutationCount, 1);
  assert.equal(renderIdRemoval.sideEffects.listenerRegistrationCount, 0);
  assert.equal(
    renderIdRemoval.sideEffects.ownerDocumentListenerRegistrationCount,
    0
  );
  assert.equal(renderIdRemoval.sideEffects.ownerDocumentMutationCount, 0);
  assert.equal(renderIdRemoval.sideEffects.containerMarker.propertyCount, 0);
  assert.equal(
    renderIdRemoval.sideEffects.containerListeningMarker.propertyCount,
    0
  );
  assert.equal(
    renderIdRemoval.sideEffects.ownerDocumentListeningMarker.propertyCount,
    0
  );
}

function assertMinimalPublicDivTextUnmountLifecycle(publicBoundary) {
  const unmount = publicBoundary.publicRootLifecycle.unmount;
  assert.equal(
    unmount.label,
    MINIMAL_PUBLIC_DIV_TEXT_UNMOUNT_API
  );
  assert.equal(unmount.status, "ok");
  assert.equal(unmount.value.type, "undefined");
  assert.equal(unmount.compatibilityClaimed, false);
  assert.equal(unmount.controlledDomShim, true);
  assert.equal(unmount.renderElementType, "div");
  assert.equal(unmount.renderTextContent, MINIMAL_PUBLIC_DIV_TEXT);
  assert.equal(unmount.duplicateRootTrackingCleared, true);
  assert.equal(unmount.rootObjectCreated, true);
  assert.equal(unmount.lifecycleOperationAttempted, true);
  assert.equal(unmount.createRootAttempt.status, "ok");
  assert.deepEqual(
    unmount.controlledDomSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_UNMOUNT_SNAPSHOT
  );
  assert.equal(unmount.sideEffects.mutationCount, 2);
  assert.equal(unmount.sideEffects.listenerRegistrationCount, 0);
  assert.equal(unmount.sideEffects.ownerDocumentListenerRegistrationCount, 0);
  assert.equal(unmount.sideEffects.ownerDocumentMutationCount, 0);
  assert.equal(unmount.sideEffects.containerMarker.propertyCount, 0);
  assert.equal(unmount.sideEffects.containerListeningMarker.propertyCount, 0);
  assert.equal(
    unmount.sideEffects.ownerDocumentListeningMarker.propertyCount,
    0
  );
}

function assertMinimalPublicDivTextRecreateAfterUnmountLifecycle(
  publicBoundary
) {
  const recreateAfterUnmount =
    publicBoundary.publicRootLifecycle.recreateAfterUnmount;
  assert.equal(
    recreateAfterUnmount.label,
    MINIMAL_PUBLIC_DIV_TEXT_RECREATE_AFTER_UNMOUNT_API
  );
  assert.equal(recreateAfterUnmount.status, "ok");
  assert.equal(recreateAfterUnmount.value.type, "undefined");
  assert.equal(recreateAfterUnmount.compatibilityClaimed, false);
  assert.equal(recreateAfterUnmount.controlledDomShim, true);
  assert.equal(recreateAfterUnmount.renderElementType, "div");
  assert.equal(
    recreateAfterUnmount.renderTextContent,
    MINIMAL_PUBLIC_DIV_TEXT
  );
  assert.equal(recreateAfterUnmount.rootObjectCreated, true);
  assert.equal(recreateAfterUnmount.lifecycleOperationAttempted, true);
  assert.equal(recreateAfterUnmount.createRootAttempt.status, "ok");
  assert.equal(recreateAfterUnmount.freshCreateRootAttempt.status, "ok");
  assert.equal(recreateAfterUnmount.freshRootObjectCreated, true);
  assert.equal(recreateAfterUnmount.recreatedRootDistinct, true);
  assert.equal(recreateAfterUnmount.freshRenderAttempt.status, "ok");
  assert.equal(recreateAfterUnmount.freshRenderAttempt.value.type, "undefined");
  assert.equal(recreateAfterUnmount.freshUnmountAttempt.status, "ok");
  assert.equal(
    recreateAfterUnmount.freshUnmountAttempt.value.type,
    "undefined"
  );
  assert.equal(
    recreateAfterUnmount.staleRenderAfterUnmountAttempt.status,
    "throws"
  );
  assert.equal(
    recreateAfterUnmount.staleRenderAfterUnmountAttempt.thrown.code,
    "FAST_REACT_UNIMPLEMENTED"
  );
  assert.equal(
    recreateAfterUnmount.staleRenderAfterUnmountAttempt.thrown.exportName,
    "createRoot().render"
  );
  assert.equal(
    recreateAfterUnmount.staleUnmountAfterUnmountAttempt.status,
    "throws"
  );
  assert.equal(
    recreateAfterUnmount.staleUnmountAfterUnmountAttempt.thrown.code,
    "FAST_REACT_UNIMPLEMENTED"
  );
  assert.equal(
    recreateAfterUnmount.staleUnmountAfterUnmountAttempt.thrown.exportName,
    "createRoot().unmount"
  );
  assert.deepEqual(
    recreateAfterUnmount.recreateSnapshots.initialRender,
    MINIMAL_PUBLIC_DIV_TEXT_SNAPSHOT
  );
  assert.deepEqual(
    recreateAfterUnmount.recreateSnapshots.sameRootUpdate,
    MINIMAL_PUBLIC_DIV_TEXT_REPEAT_RENDER_SNAPSHOT
  );
  assert.deepEqual(
    recreateAfterUnmount.recreateSnapshots.firstUnmount,
    MINIMAL_PUBLIC_DIV_TEXT_UNMOUNT_SNAPSHOT
  );
  assert.deepEqual(
    recreateAfterUnmount.recreateSnapshots.afterStaleOldRootAttempts,
    MINIMAL_PUBLIC_DIV_TEXT_UNMOUNT_SNAPSHOT
  );
  assert.deepEqual(
    recreateAfterUnmount.recreateSnapshots.freshRender,
    MINIMAL_PUBLIC_DIV_TEXT_RECREATE_RENDER_SNAPSHOT
  );
  assert.deepEqual(
    recreateAfterUnmount.controlledDomSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_RECREATE_UNMOUNT_SNAPSHOT
  );
  assert.equal(recreateAfterUnmount.sideEffects.mutationCount, 4);
  assert.equal(recreateAfterUnmount.sideEffects.listenerRegistrationCount, 0);
  assert.equal(
    recreateAfterUnmount.sideEffects.ownerDocumentListenerRegistrationCount,
    0
  );
  assert.equal(recreateAfterUnmount.sideEffects.ownerDocumentMutationCount, 0);
  assert.equal(
    recreateAfterUnmount.sideEffects.containerMarker.propertyCount,
    0
  );
  assert.equal(
    recreateAfterUnmount.sideEffects.containerListeningMarker.propertyCount,
    0
  );
  assert.equal(
    recreateAfterUnmount.sideEffects.ownerDocumentListeningMarker.propertyCount,
    0
  );
}

function assertBlockedPublicLifecycleOperation(operation, exportName) {
  assert.equal(operation.status, "throws");
  assert.equal(operation.thrown.code, "FAST_REACT_UNIMPLEMENTED");
  assert.equal(operation.thrown.exportName, exportName);
  assert.equal(operation.thrown.entrypoint, "react-dom/client");
  assert.equal(operation.blockedAt, null);
  assert.equal(operation.rootObjectCreated, true);
  assert.equal(operation.lifecycleOperationAttempted, true);
  assert.equal(operation.createRootAttempt.status, "ok");
  assert.equal(operation.compatibilityClaimed, false);
  assertPublicRootFacadeSideEffectFree(operation.sideEffects);
}

function assertMinimalPublicRootBoundary(publicBoundary) {
  assertMinimalPublicCreateRootBoundary(publicBoundary);
  assertBlockedPublicHydrateRootBoundary(publicBoundary);
  assertBlockedPublicLifecycleOperation(
    publicBoundary.publicRootLifecycle.renderInitial,
    "createRoot().render"
  );
  assertMinimalPublicDivTextLifecycle(publicBoundary);
  assertMinimalPublicDivTextUpdateLifecycle(publicBoundary);
  assertMinimalPublicDivTextIdRemovalLifecycle(publicBoundary);
  assertMinimalPublicDivTextUnmountLifecycle(publicBoundary);
  assertMinimalPublicDivTextRecreateAfterUnmountLifecycle(publicBoundary);
}

test("React DOM public root facade gate blocks placeholders while oracle prerequisites remain accepted", () => {
  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle
  });

  assert.equal(gate.ok, true);
  assert.equal(gate.summary.compatibilityAdmitted, false);
  assert.equal(gate.summary.compatibilityClaimed, false);
  assert.equal(
    gate.summary.acceptedClientRootScenarioModeRowCount,
    clientRootOracle.scenarios.length * REACT_DOM_CLIENT_ROOT_PROBE_MODES.length
  );
  assert.equal(
    gate.summary.acceptedRootRenderScenarioModeRowCount,
    REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length *
      REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length
  );
  assert.equal(
    gate.blockedScenarioModeRows.length,
    REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length *
      REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length
  );
  assert.deepEqual(
    gate.blockedPublicFacadeRows.map((row) => row.id),
    REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_BOUNDARY_ROWS.map((row) => row.id)
  );
  assert.equal(
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ADMISSIONS.filter(
      (admission) => Number(admission.workerId) >= 503
    ).length,
    16
  );
  const privateMetadataBlockedRow = gate.blockedPublicFacadeRows.find(
    (row) =>
      row.id ===
      "public-root-render-private-react-dom-metadata-compatibility"
  );
  assert.equal(
    privateMetadataBlockedRow.gateStatus,
    REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS
  );
  assert.equal(privateMetadataBlockedRow.compatibilityClaimed, false);
  assert.equal(
    privateMetadataBlockedRow.privateReactDomMetadataEvidence,
    "separate"
  );
  assert.equal(gate.blockedPrivateBridgeRows.length, 8);
  assert.equal(
    gate.rootRenderGate.summary.privateHostOutputDiagnosticScenarioModeRowCount,
    18
  );
  assert.equal(
    gate.rootRenderGate.summary.privateHostOutputBlockedScenarioModeRowCount,
    2
  );
  assert.equal(
    gate.rootRenderGate.summary.privateHostOutputCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary.privateWarningBoundaryDiagnosticScenarioModeRowCount,
    2
  );
  assert.equal(
    gate.rootRenderGate.summary.privateWarningBoundaryBlockedScenarioModeRowCount,
    18
  );
  assert.equal(
    gate.rootRenderGate.summary.privateWarningBoundaryCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary.privateWarningBoundaryConsoleOutputUsedAsEvidence,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateCrossRootSchedulingDiagnosticScenarioModeRowCount,
    2
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateCrossRootSchedulingBlockedScenarioModeRowCount,
    18
  );
  assert.equal(
    gate.rootRenderGate.summary.privateCrossRootSchedulingCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateCrossRootSchedulingPublicFlushSyncCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary.privateActPassiveDiagnosticScenarioModeRowCount,
    20
  );
  assert.equal(
    gate.rootRenderGate.summary.privateActPassiveBlockedScenarioModeRowCount,
    0
  );
  assert.equal(
    gate.rootRenderGate.summary.privateActPassiveCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateActPassivePublicReactActCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateActPassivePublicReactDomTestUtilsActCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateActPassivePublicRootRenderCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateActPassivePublicPassiveEffectCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary.privateRootWorkLoopCommitHandoffDiagnosticRowCount,
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ADMISSIONS.length *
      REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicRootCompatibilitySurface,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicCreateRootCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicRootRenderCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicRootUpdateCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicRootUnmountCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicHydrateRootCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicHydrationCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicDomMutationCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicTestRendererCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary.privateReactDomMetadataDiagnosticRowCount,
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ADMISSIONS.length *
      REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length
  );
  assert.equal(
    gate.rootRenderGate.summary.privateReactDomMetadataCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicRootRenderCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicHydrationCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicEventCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicResourceCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicFormCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicControlledInputCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary.privatePromotion503533RejectedRowCount,
    REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS.length
  );
  assert.equal(
    gate.rootRenderGate.summary.privatePromotion503533CompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicRootCompatibilitySurface,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicRenderCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicRootRenderCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicHydrationCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicEventCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicResourceCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicFormCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicControlledInputCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicTestRendererCompatibilityClaimed,
    false
  );
  assert.deepEqual(
    gate.privatePromotionRejectionRows503533.map((row) => row.id),
    REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS.map(
      (row) => row.id
    )
  );
  for (const row of gate.privatePromotionRejectionRows503533) {
    assert.equal(
      row.gateStatus,
      REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_REJECTED_STATUS
    );
    assert.equal(row.promotion, "rejected");
    assert.equal(row.privateEvidenceOnly, true);
    assert.equal(row.compatibilityClaimed, false);
    assert.deepEqual(
      row.blockedPublicCompatibilitySurfaces,
      REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_BLOCKED_SURFACES
    );
    for (const claimKey of REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_CLAIM_KEYS) {
      assert.equal(row[claimKey], false, `${row.id} ${claimKey}`);
      assert.equal(
        row.publicCompatibilityClaims[claimKey],
        false,
        `${row.id} publicCompatibilityClaims.${claimKey}`
      );
    }
  }
  assert.equal(gate.rootRenderGate.summary.portalRootRenderBlockedRowCount, 5);
  assert.equal(
    gate.rootRenderGate.summary.privatePortalMetadataPromotesPublicRootRender,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary.portalRootRenderCompatibilityClaimed,
    false
  );
  for (const row of gate.blockedPublicFacadeRows) {
    assert.equal(row.gateStatus, REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS);
    assert.notEqual(row.gateStatus, "accepted-private-root-host-output-diagnostic");
    assert.notEqual(
      row.gateStatus,
      REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_ACCEPTED_STATUS
    );
    assert.notEqual(
      row.gateStatus,
      REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ACCEPTED_STATUS
    );
    assert.notEqual(
      row.gateStatus,
      REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ACCEPTED_STATUS
    );
    assert.notEqual(
      row.gateStatus,
      REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ACCEPTED_STATUS
    );
    assert.notEqual(
      row.gateStatus,
      REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ACCEPTED_STATUS
    );
    assert.notEqual(row.gateStatus, "blocked-portal-root-render");
    if ("compatibilityClaimed" in row) {
      assert.equal(row.compatibilityClaimed, false);
    }
  }
});

test("React DOM private act/passive diagnostics are recognized as private rows", () => {
  const rootRenderGate = evaluateReactDomRootRenderE2EConformanceGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle
  });
  const expectedRowCount =
    REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length *
    REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length;

  assert.equal(rootRenderGate.ok, true);
  assert.equal(
    rootRenderGate.summary.privateActPassiveDiagnosticScenarioModeRowCount,
    expectedRowCount
  );
  assert.equal(
    rootRenderGate.privateActPassiveDiagnosticScenarioModeRows.length,
    expectedRowCount
  );
  assert.equal(rootRenderGate.privateActPassiveBlockedScenarioModeRows.length, 0);
  assert.equal(
    rootRenderGate.summary.privateActPassiveCompatibilityClaimed,
    false
  );

  const representativeRow =
    rootRenderGate.privateActPassiveDiagnosticScenarioModeRows.find(
      (row) =>
        row.modeId === "default-node-development" &&
        row.scenarioId === "initial-host-render"
    );

  assert.ok(representativeRow);
  assert.equal(
    representativeRow.gateStatus,
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ACCEPTED_STATUS
  );
  assert.equal(representativeRow.compatibilityClaimed, false);
  assert.equal(representativeRow.publicReactActCompatibilityClaimed, false);
  assert.equal(
    representativeRow.publicReactDomTestUtilsActCompatibilityClaimed,
    false
  );
  assert.equal(representativeRow.publicRootRenderCompatibilityClaimed, false);
  assert.equal(representativeRow.publicPassiveEffectCompatibilityClaimed, false);
  assert.deepEqual(
    representativeRow.actEvidence.reactDomTestUtilsActGate.sideEffectPolicy,
    {
      invokesActCallback: false,
      executesQueuedWork: false,
      executesPassiveEffects: false,
      executesRendererWork: false,
      executesRendererRoots: false,
      executesPublicRendererRoots: false,
      executesPublicDomMutation: false,
      executesSyncFlush: false,
      executesPublicFlushSync: false,
      emitsDeprecationWarning: false,
      delegatesToReactAct: false
    }
  );
  assert.equal(
    representativeRow.passiveEvidence.passiveEffectCallbackHandles
      .schedulerDrivenPassiveExecutionEnabled,
    false
  );
  assert.equal(
    representativeRow.passiveEvidence.passiveEffectCallbackHandles
      .publicEffectExecutionEnabled,
    false
  );
  assert.equal(
    representativeRow.passiveEvidence.passiveEffects.executesPassiveEffects,
    false
  );
});

test("React DOM public root facade scenario admission is explicit and non-compatible", () => {
  assert.deepEqual(
    REACT_DOM_ROOT_PUBLIC_FACADE_SCENARIO_ADMISSIONS.map(
      (admission) => admission.scenarioId
    ),
    REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS
  );

  for (const admission of REACT_DOM_ROOT_PUBLIC_FACADE_SCENARIO_ADMISSIONS) {
    assert.equal(admission.admission, "blocked");
    assert.equal(
      admission.gateStatus,
      REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS
    );
    assert.equal(admission.comparedToAcceptedReactDomOracle, true);
    assert.equal(admission.publicCompatibilityClaimed, false);
  }
});

test("React DOM public root facade inspection records current placeholder boundary", () => {
  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();

  assert.deepEqual(publicBoundary.exportKeys, [
    "createRoot",
    "hydrateRoot",
    "version"
  ]);
  assert.deepEqual(publicBoundary.placeholderMetadata, {
    placeholder: true,
    entrypoint: "react-dom/client",
    compatibilityTarget: "react-dom@19.2.6"
  });
  assertMinimalPublicRootBoundary(publicBoundary);
});

test("React DOM public createRoot rejects explicit options and extra arguments", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const React = require(path.join(repoRoot, "packages/react/index.js"));
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  let callbackCalls = 0;
  const blockedArgumentCases = [
    {
      args: [undefined],
      label: "undefined-options"
    },
    {
      args: [
        {
          onRecoverableError() {
            callbackCalls++;
          }
        }
      ],
      label: "recoverable-error-options"
    },
    {
      args: [undefined, "extra"],
      label: "undefined-options-extra-argument"
    }
  ];

  for (const blockedCase of blockedArgumentCases) {
    const document = createPrivateGateDocument(
      `public-create-root-${blockedCase.label}-blocked`,
      domContainer
    );
    const container = createPrivateGateElement("DIV", document, domContainer);
    let createRootResult;

    assert.throws(
      () => {
        createRootResult = reactDomClient.createRoot(
          container,
          ...blockedCase.args
        );
      },
      (error) => {
        assert.equal(error.name, "FastReactDomUnimplementedError");
        assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
        assert.equal(error.entrypoint, "react-dom/client");
        assert.equal(error.exportName, "createRoot");
        assert.match(
          error.message,
          /Root options, callbacks, hydration, scheduler hooks, and compatibility claims remain blocked\./
        );
        return true;
      }
    );
    assert.equal(createRootResult, undefined);
    assert.equal(
      rootMarkers.inspectContainerRootMarker(container).propertyCount,
      0
    );
    assert.equal(rootMarkers.isContainerMarkedAsRoot(container), false);
    assert.equal(listenerRegistry.hasListeningMarker(container), false);
    assert.equal(listenerRegistry.hasListeningMarker(document), false);
    assert.equal(container.__registrations.length, 0);
    assert.equal(document.__registrations.length, 0);
    assert.equal(container.__mutationLog.length, 0);
    assert.equal(document.__mutationLog.length, 0);
  }
  assert.equal(callbackCalls, 0);

  const document = createPrivateGateDocument(
    "public-create-root-no-options-accepted",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const root = reactDomClient.createRoot(container);

  assert.deepEqual(Object.keys(root), ["render", "unmount"]);
  assert.equal(
    root.render(
      React.createElement(
        "div",
        { id: MINIMAL_PUBLIC_DIV_TEXT_ID },
        MINIMAL_PUBLIC_DIV_TEXT
      )
    ),
    undefined
  );
  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild.nodeName, "DIV");
  assert.deepEqual(attributeEntries(container.firstChild), [
    ["id", MINIMAL_PUBLIC_DIV_TEXT_ID]
  ]);
  assert.equal(
    container.firstChild.getAttribute("id"),
    MINIMAL_PUBLIC_DIV_TEXT_ID
  );
  assert.equal(container.firstChild.textContent, MINIMAL_PUBLIC_DIV_TEXT);
  assert.equal(container.textContent, MINIMAL_PUBLIC_DIV_TEXT);
  const initialHostNode = container.firstChild;

  assert.equal(
    root.render(
      React.createElement(
        "div",
        { id: MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID },
        MINIMAL_PUBLIC_DIV_TEXT_UPDATE
      )
    ),
    undefined
  );
  assert.equal(container.firstChild, initialHostNode);
  assert.deepEqual(attributeEntries(container.firstChild), [
    ["id", MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID]
  ]);
  assert.equal(
    container.firstChild.getAttribute("id"),
    MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID
  );
  assert.equal(container.firstChild.textContent, MINIMAL_PUBLIC_DIV_TEXT_UPDATE);
  assert.equal(container.textContent, MINIMAL_PUBLIC_DIV_TEXT_UPDATE);

  assert.equal(
    root.render(
      React.createElement("div", null, MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL)
    ),
    undefined
  );
  assert.equal(container.firstChild, initialHostNode);
  assert.deepEqual(attributeEntries(container.firstChild), []);
  assert.equal(container.firstChild.getAttribute("id"), null);
  assert.equal(
    container.firstChild.textContent,
    MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL
  );
  assert.equal(container.textContent, MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL);
  assert.equal(root.unmount(), undefined);
  assert.equal(container.childNodes.length, 0);
  assert.equal(container.textContent, "");
  assert.equal(
    rootMarkers.inspectContainerRootMarker(container).propertyCount,
    0
  );
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
});

test("React DOM client private facade adapter is symbol-only and routes to private records", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const symbol = rootBridge.privateRootPublicFacadeAdapterSymbol;
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    symbol
  );

  assert.deepEqual(Object.keys(reactDomClient), [
    "createRoot",
    "hydrateRoot",
    "version"
  ]);
  assert.equal(Object.hasOwn(reactDomClient, "rootPublicFacadeAdapter"), false);
  assert.equal(
    Object.hasOwn(
      reactDomClient,
      "__FAST_REACT_PRIVATE_ROOT_PUBLIC_FACADE_ADAPTER__"
    ),
    false
  );
  assert.equal(Symbol.keyFor(symbol), "fast.react_dom.client.private_root_public_facade_adapter");
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(descriptor.value, rootBridge.createPrivateRootPublicFacadeAdapter);
  assert.equal(
    Object.getOwnPropertyDescriptor(reactDomClient.hydrateRoot, symbol),
    undefined
  );

  const document = createPrivateGateDocument(
    "public-facade-private-adapter",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const adapter = descriptor.value({
    requestIdPrefix: "facade-conformance-request",
    rootIdPrefix: "facade-conformance-root",
    updateIdPrefix: "facade-conformance-update"
  });
  const root = adapter.createRoot(container);
  const create = adapter.getRootCreateRecord(root);
  const render = root.render({
    props: {
      children: "adapter child"
    },
    type: "span"
  });
  const renderPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(render);
  const unmount = root.unmount();

  assert.equal(
    adapter.adapterStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_ADAPTER_READY
  );
  assert.equal(adapter.publicCreateRootEnabled, false);
  assert.equal(adapter.publicHydrateRootEnabled, false);
  assert.equal(adapter.compatibilityClaimed, false);
  assert.equal(create.requestType, "createRoot");
  assert.equal(
    render.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_APPLIED
  );
  assert.equal(renderPayload.renderRecord.requestType, "root.render");
  assert.equal(unmount.requestType, "root.unmount");
  assert.equal(create.requestId, "facade-conformance-request:1");
  assert.equal(renderPayload.renderRecord.updateId, "facade-conformance-update:1");
  assert.equal(unmount.updateId, "facade-conformance-update:2");
  assert.deepEqual(adapter.getRootRequestRecords(root), [
    create,
    renderPayload.renderRecord,
    unmount
  ]);
  assert.equal(rootBridge.getPrivateRootPublicFacadeRootPayload(root).root, root);
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeRootPayload(root).rootType,
    rootBridge.privateRootPublicFacadeRootType
  );
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.deepEqual(
    container.__mutationLog.map((entry) => entry.type),
    ["appendChild", "removeChild"]
  );
  assert.equal(document.__mutationLog.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assertMinimalPublicCreateRootBoundary(publicBoundary);
  assertBlockedPublicHydrateRootBoundary(publicBoundary);
  assert.deepEqual(publicBoundary.exportKeys, [
    "createRoot",
    "hydrateRoot",
    "version"
  ]);
});

test("React DOM client private facade preflight is symbol-only and routes to accepted diagnostics", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const symbol = rootBridge.privateRootPublicFacadePreflightSymbol;
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    symbol
  );

  assert.deepEqual(Object.keys(reactDomClient), [
    "createRoot",
    "hydrateRoot",
    "version"
  ]);
  assert.equal(Object.hasOwn(reactDomClient, "rootPublicFacadePreflight"), false);
  assert.equal(
    Symbol.keyFor(symbol),
    "fast.react_dom.client.private_root_public_facade_preflight"
  );
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(descriptor.value, rootBridge.createPrivateRootPublicFacadePreflight);
  assert.equal(
    Object.getOwnPropertyDescriptor(reactDomClient.hydrateRoot, symbol),
    undefined
  );

  const document = createPrivateGateDocument(
    "public-facade-private-preflight",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const preflight = descriptor.value({
    nativeEnvironmentId: 427,
    nativeHandoffIdPrefix: "facade-preflight-native",
    publicFacadePreflightIdPrefix: "facade-preflight",
    requestIdPrefix: "facade-preflight-request",
    rootIdPrefix: "facade-preflight-root",
    updateIdPrefix: "facade-preflight-update"
  });
  const root = preflight.createRoot(container);
  const create = preflight.getRootCreatePreflight(root);
  const render = root.render({
    props: {
      children: "preflight child"
    },
    type: "span"
  });
  const unmount = root.unmount();

  assert.equal(
    preflight.preflightStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_READY
  );
  assert.equal(preflight.publicCreateRootEnabled, false);
  assert.equal(preflight.publicHydrateRootEnabled, false);
  assert.equal(preflight.acceptedPrivateBridgeDiagnostics, true);
  assert.equal(preflight.compatibilityClaimed, false);
  assert.equal(
    rootBridge.isPrivateRootPublicFacadePreflight(preflight),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPublicFacadePreflightRoot(root),
    true
  );
  assert.equal(rootBridge.isPrivateRootPublicFacadePreflightRecord(create), true);
  assert.deepEqual(Object.keys(root), ["render", "unmount"]);
  assert.equal(create.facadeCall, "createRoot");
  assert.equal(render.facadeCall, "root.render");
  assert.equal(unmount.facadeCall, "root.unmount");
  for (const record of [create, render, unmount]) {
    assert.equal(
      record.preflightStatus,
      rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_ACCEPTED
    );
    assert.equal(
      record.requestAdmissionStatus,
      rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
    );
    assert.equal(
      record.nativeHandoffStatus,
      rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
    );
    assert.equal(record.publicRootCompatibilitySurface, false);
    assert.equal(record.nativeExecution, false);
    assert.equal(record.reconcilerExecution, false);
    assert.equal(record.domMutation, false);
    assert.equal(record.markerWrites, false);
    assert.equal(record.listenerInstallation, false);
    assert.equal(record.compatibilityClaimed, false);
  }
  assert.equal(create.requestId, "facade-preflight-request:1");
  assert.equal(render.updateId, "facade-preflight-update:1");
  assert.equal(unmount.updateId, "facade-preflight-update:2");
  assert.deepEqual(preflight.getRootPreflightRecords(root), [
    create,
    render,
    unmount
  ]);
  assert.equal(
    rootBridge.getPrivateRootPublicFacadePreflightPayload(preflight)
      .preflightRecordCount,
    3
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadePreflightRootPayload(root)
      .rootType,
    rootBridge.privateRootPublicFacadePreflightRootType
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadePreflightRecordPayload(render)
      .requestAdmission,
    render.requestAdmission
  );
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assertMinimalPublicCreateRootBoundary(publicBoundary);
  assertBlockedPublicHydrateRootBoundary(publicBoundary);
});

test("React DOM client private hydrateRoot facade preflight is symbol-only and blocked", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const hydrationGate = require(
    path.join(
      repoRoot,
      "packages/react-dom/src/client/hydration-boundary-gate.js"
    )
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const symbol = rootBridge.privateHydrateRootPublicFacadePreflightSymbol;
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.hydrateRoot,
    symbol
  );

  assert.deepEqual(Object.keys(reactDomClient), [
    "createRoot",
    "hydrateRoot",
    "version"
  ]);
  assert.equal(
    Object.hasOwn(reactDomClient, "hydrateRootPublicFacadePreflight"),
    false
  );
  assert.equal(
    Symbol.keyFor(symbol),
    "fast.react_dom.client.private_hydrate_root_public_facade_preflight"
  );
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(
    descriptor.value,
    rootBridge.createPrivateHydrateRootPublicFacadePreflight
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(reactDomClient.createRoot, symbol),
    undefined
  );

  const document = createPrivateGateDocument(
    "public-facade-hydrate-private-preflight",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const initialChildren = {
    props: {
      children: "hydrate preflight child"
    },
    type: "span"
  };
  const options = {
    identifierPrefix: "hydrate-preflight-",
    onRecoverableError() {}
  };
  const preflight = descriptor.value({
    hydrateIdPrefix: "facade-hydrate",
    publicFacadeHydratePreflightIdPrefix: "facade-hydrate-preflight",
    requestIdPrefix: "facade-hydrate-request"
  });
  const record = preflight.hydrateRoot(container, initialChildren, options);
  const payload =
    rootBridge.getPrivateHydrateRootPublicFacadePreflightRecordPayload(
      record
    );
  const hydratePayload = rootBridge.getPrivateRootRecordPayload(
    payload.requestRecord
  );
  const markerListenerPreflight = record.markerListenerPreflight;
  const markerListenerPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeMarkerListenerPreflightPayload(
      markerListenerPreflight
    );

  assert.equal(
    preflight.preflightStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_READY
  );
  assert.equal(preflight.publicCreateRootEnabled, false);
  assert.equal(preflight.publicHydrateRootEnabled, false);
  assert.equal(preflight.compatibilityClaimed, false);
  assert.equal(
    rootBridge.isPrivateHydrateRootPublicFacadePreflight(preflight),
    true
  );
  assert.equal(
    rootBridge.isPrivateHydrateRootPublicFacadePreflightRecord(record),
    true
  );
  assert.equal(record.preflightId, "facade-hydrate-preflight:1");
  assert.equal(record.requestId, "facade-hydrate-request:1");
  assert.equal(record.requestType, "hydrateRoot");
  assert.equal(record.facadeCall, "hydrateRoot");
  assert.equal(record.operation, "hydrate");
  assert.equal(record.hydrateId, "facade-hydrate:1");
  assert.equal(record.rootId, null);
  assert.equal(record.rootKind, "unsupported-hydration");
  assert.equal(
    record.requestAdmissionStatus,
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
  );
  assert.equal(record.nativeHandoffRecord, null);
  assert.equal(
    record.nativeHandoffStatus,
    rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED
  );
  assert.equal(
    record.markerListenerPreflightStatus,
    rootBridge.ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_MARKER_LISTENER_PREFLIGHTED
  );
  assert.equal(record.markerListenerPreconditionsAccepted, true);
  assert.equal(record.markerListenerStateUnchanged, true);
  assert.equal(record.hydrationRequested, true);
  assert.equal(record.canHydrate, false);
  assert.equal(record.publicRootCreated, false);
  assert.equal(record.publicRootObjectExposed, false);
  assert.equal(record.containerMarked, false);
  assert.equal(record.listenersAttached, false);
  assert.equal(record.domMutated, false);
  assert.equal(record.eventsReplayed, false);
  assert.equal(record.rootScheduled, false);
  assert.equal(record.suspenseHydrationScheduled, false);
  assert.equal(record.nativeExecution, false);
  assert.equal(record.reconcilerExecution, false);
  assert.equal(record.domMutation, false);
  assert.equal(record.markerWrites, false);
  assert.equal(record.listenerInstallation, false);
  assert.equal(record.hydration, false);
  assert.equal(record.eventDispatch, false);
  assert.equal(record.compatibilityClaimed, false);
  assert.deepEqual(
    record.acceptedCapabilities.map((capability) => capability.id),
    [
      "private-hydrate-root-bridge-request-admission",
      "hydrate-root-lifecycle-request-boundary",
      "unsupported-hydration-boundary-diagnostics",
      "hydrate-root-marker-listener-preflight-diagnostics",
      "hydrate-root-recoverable-error-preflight-diagnostics"
    ]
  );
  assert.equal(
    rootBridge.isPrivateHydrateRootPublicFacadeMarkerListenerPreflightRecord(
      markerListenerPreflight
    ),
    true
  );
  assert.equal(payload.markerListenerPreflight, markerListenerPreflight);
  assert.equal(markerListenerPayload.container, container);
  assert.equal(markerListenerPayload.ownerDocument, document);
  assert.equal(markerListenerPayload.requestRecord, payload.requestRecord);
  assert.equal(
    markerListenerPreflight.preflightStatus,
    rootBridge.ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_MARKER_LISTENER_PREFLIGHTED
  );
  assert.equal(
    markerListenerPreflight.markerListenerPreflightId,
    "facade-hydrate-preflight:1:marker-listener"
  );
  assert.equal(markerListenerPreflight.preconditions.accepted, true);
  assert.equal(markerListenerPreflight.preconditions.stateUnchanged, true);
  assert.equal(
    markerListenerPreflight.preconditions.markerGuardMatchesContainerState,
    true
  );
  assert.equal(
    markerListenerPreflight.preconditions.listenerGuardMatchesContainerState,
    true
  );
  assert.equal(
    markerListenerPreflight.preconditions.isContainerMarkedAsRoot,
    false
  );
  assert.equal(
    markerListenerPreflight.preconditions.rootMarkerPropertyCount,
    0
  );
  assert.equal(
    markerListenerPreflight.preconditions.rootListeningMarkerPresent,
    false
  );
  assert.equal(
    markerListenerPreflight.preconditions.rootListenerRegistrationCount,
    0
  );
  assert.equal(
    markerListenerPreflight.preconditions
      .ownerDocumentListenerRegistrationCount,
    0
  );
  assert.equal(markerListenerPreflight.markerWrites, false);
  assert.equal(markerListenerPreflight.listenerInstallation, false);
  assert.equal(markerListenerPreflight.hydration, false);
  assert.equal(markerListenerPreflight.eventDispatch, false);
  assert.equal(markerListenerPreflight.compatibilityClaimed, false);
  assert.equal(
    markerListenerPreflight.blockerEvidence.rootMarkerWriteBlocked,
    true
  );
  assert.equal(
    markerListenerPreflight.blockerEvidence.rootListenerInstallationBlocked,
    true
  );
  assert.deepEqual(
    markerListenerPreflight.acceptedCapabilities.map(
      (capability) => capability.id
    ),
    [
      "hydrate-root-marker-guard-snapshot",
      "hydrate-root-lifecycle-request-boundary-required",
      "hydrate-root-listener-guard-snapshot",
      "hydrate-root-marker-listener-state-unchanged"
    ]
  );
  assert.deepEqual(
    record.blockedCapabilities.map((capability) => capability.id),
    [
      "public-hydrate-root-execution",
      "public-root-object",
      "native-request-handoff",
      "native-execution",
      "reconciler-execution",
      "dom-mutation",
      "marker-writes",
      "listener-installation",
      "hydration",
      "events",
      "compatibility-claims"
    ]
  );
  assert.equal(
    record.acceptedPrivateMetadataDiagnostics,
    record.hydrationBoundaryRecord.acceptedPrivateMetadataDiagnostics
  );
  assert.equal(
    payload.requestRecord.acceptedPrivateMetadataDiagnostics,
    record.acceptedPrivateMetadataDiagnostics
  );
  assert.equal(
    record.acceptedPrivateMetadataDiagnostics.rootRecordId,
    record.hydrationBoundaryRecord.recordId
  );
  assert.equal(
    record.acceptedPrivateMetadataIds,
    record.acceptedPrivateMetadataDiagnostics.metadataIds
  );
  assert.equal(
    record.acceptedPrivateMetadataGateIds,
    record.acceptedPrivateMetadataDiagnostics.gateIds
  );
  assert.equal(
    record.acceptedPrivateMetadataDiagnostics.compatibilityClaimed,
    false
  );
  for (const field of hydrateRootAcceptedPrivateMetadataBlockedPublicFields) {
    assert.equal(
      record.acceptedPrivateMetadataDiagnostics[field],
      false,
      field
    );
  }
  assert.equal(
    Array.isArray(record.acceptedPrivateMetadataDiagnostics.metadataRows),
    true
  );
  assert.equal(
    record.acceptedPrivateMetadataDiagnostics.metadataRows.length,
    record.acceptedPrivateMetadataDiagnostics.metadataIdCount
  );
  record.acceptedPrivateMetadataDiagnostics.metadataRows.forEach(
    (row, index) => {
      assert.equal(
        row.metadataId,
        record.acceptedPrivateMetadataDiagnostics.metadataIds[index]
      );
      assert.equal(
        row.gateId,
        record.acceptedPrivateMetadataDiagnostics.gateIds[index]
      );
      assert.equal(
        row.recordType,
        record.acceptedPrivateMetadataDiagnostics.acceptedRecordTypes[index]
      );
      assert.equal(
        row.acceptedStatus,
        record.acceptedPrivateMetadataDiagnostics.acceptedStatuses[index]
      );
      assert.equal(row.metadataRecognized, true);
      assert.equal(row.diagnosticOnly, true);
      assert.equal(row.readOnly, true);
      for (
        const field of
          hydrateRootAcceptedPrivateMetadataRowBlockedPublicFields
      ) {
        assert.equal(row[field], false, field);
      }
    }
  );
  assert.equal(
    record.acceptedPrivateMetadataDiagnostics
      .publicHydrationCompatibilityClaimed,
    false
  );
  assert.equal(
    record.acceptedPrivateMetadataDiagnostics
      .publicHydrationReplayCompatibilityClaimed,
    false
  );
  assert.equal(
    record.recoverableErrorPreflight.recoverableErrorMetadata,
    record.recoverableErrorMetadata
  );
  assert.equal(
    record.recoverableErrorPreflight.acceptedBoundaryMetadataDiagnostics,
    record.acceptedPrivateMetadataDiagnostics
  );
  assert.equal(
    record.recoverableErrorPreflightStatus,
    hydrationGate.privateHydrationTextMismatchRecoverableErrorPreflightStatus
  );
  assert.equal(record.recoverableErrorPreflightAccepted, true);
  assert.equal(record.recoverableErrorMetadataAccepted, true);
  assert.equal(record.recoverableErrorMetadataCount, 1);
  assert.equal(record.queuedRecoverableErrorCount, 0);
  assert.equal(record.wouldQueueRecoverableErrorCount, 1);
  assert.equal(record.recoverableErrorsQueued, false);
  assert.equal(record.willQueueRecoverableErrors, false);
  assert.equal(record.onRecoverableErrorConfigured, true);
  assert.equal(record.onRecoverableErrorInvoked, false);
  assert.equal(record.publicOnRecoverableErrorInvoked, false);
  assert.equal(record.rootErrorCallbackInvocationCount, 0);
  assert.equal(
    rootBridge.isPrivateHydrationTextMismatchRecoverableErrorPreflightRecord(
      record.recoverableErrorPreflight
    ),
    true
  );
  assert.equal(
    rootBridge.getPrivateHydrationTextMismatchRecoverableErrorPreflightPayload(
      record.recoverableErrorPreflight
    ).hydrationBoundaryRecord,
    record.hydrationBoundaryRecord
  );
  assert.equal(
    payload.requestRecord.hydrationBoundaryRecord,
    record.hydrationBoundaryRecord
  );
  assert.equal(payload.requestAdmission, record.requestAdmission);
  assert.equal(hydratePayload.container, container);
  assert.equal(hydratePayload.initialChildren, initialChildren);
  assert.equal(hydratePayload.hydrationOptions, options);
  assert.equal(
    hydratePayload.hydrationBoundaryRecord,
    record.hydrationBoundaryRecord
  );
  assert.deepEqual(preflight.getHydrateRootPreflightRecords(), [record]);
  assert.equal(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
      .preflightRecordCount,
    1
  );
  assert.deepEqual(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
      .markerListenerPreflightRecords,
    [markerListenerPreflight]
  );
  assert.equal(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
      .markerListenerPreflightRecordCount,
    1
  );
  assert.deepEqual(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
      .recoverableErrorPreflightRecords,
    [record.recoverableErrorPreflight]
  );
  assert.equal(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
      .recoverableErrorPreflightRecordCount,
    1
  );
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assertMinimalPublicCreateRootBoundary(publicBoundary);
  assertBlockedPublicHydrateRootBoundary(publicBoundary);
});

test("React DOM client private hydrateRoot target-claiming preflight remains private and canonical", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const eventListener = require(
    path.join(repoRoot, "packages/react-dom/src/events/react-dom-event-listener.js")
  );
  const eventSystemFlags = require(
    path.join(repoRoot, "packages/react-dom/src/events/event-system-flags.js")
  );
  const pluginEventSystem = require(
    path.join(repoRoot, "packages/react-dom/src/events/plugin-event-system.js")
  );
  const symbol = rootBridge.privateHydrateRootPublicFacadePreflightSymbol;
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.hydrateRoot,
    symbol
  );
  const document = createPrivateGateDocument(
    "public-facade-hydrate-target-claim",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const target = createPrivateGateElement("BUTTON", document, domContainer);
  const start = createPrivateGateCommentNode("$", document, domContainer);
  const end = createPrivateGateCommentNode("/$", document, domContainer);
  start.parentNode = container;
  target.parentNode = container;
  end.parentNode = container;
  container.childNodes = [start, target, end];
  const preflight = descriptor.value({
    hydrateIdPrefix: "facade-hydrate-target",
    publicFacadeHydratePreflightIdPrefix:
      "facade-hydrate-target-preflight",
    requestIdPrefix: "facade-hydrate-target-request"
  });
  const hydrateRecord = preflight.hydrateRoot(
    container,
    {
      props: {
        children: "target claim"
      },
      type: "App"
    },
    {
      identifierPrefix: "hydrate-target-claim-"
    }
  );
  const wrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      "click",
      eventSystemFlags.IS_CAPTURE_PHASE
    );
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      wrapper,
      {
        target,
        type: "click"
      }
    );
  const targetClaimRecord = preflight.preflightTargetClaiming(
    hydrateRecord,
    dispatchRecord,
    {
      source: "conformance-hydrate-root-target-claiming"
    }
  );
  const targetClaimPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeTargetClaimingPreflightPayload(
      targetClaimRecord
    );
  const claimPayload =
    rootBridge.getPrivateHydrationTargetClaimingDiagnosticPayload(
      targetClaimRecord.targetClaimingDiagnostic
    );

  assert.equal(
    targetClaimRecord.preflightStatus,
    rootBridge
      .ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_TARGET_CLAIMING_PREFLIGHTED
  );
  assert.equal(Object.isFrozen(targetClaimRecord), true);
  assert.equal(
    rootBridge.isPrivateHydrateRootPublicFacadeTargetClaimingPreflightRecord(
      targetClaimRecord
    ),
    true
  );
  assert.equal(targetClaimRecord.preconditions.markerListenerPreflightRequired, true);
  assert.equal(targetClaimRecord.preconditions.canonicalTargetClaimingEvidence, true);
  assert.equal(targetClaimRecord.preconditions.targetClaimingDiagnosticImmutable, true);
  assert.equal(targetClaimRecord.markerListenerPreflight, hydrateRecord.markerListenerPreflight);
  assert.equal(targetClaimRecord.targetPath, "container.childNodes[1]");
  assert.equal(targetClaimRecord.markerPath, "container.childNodes[0]");
  assert.equal(targetClaimRecord.targetPathDeterministicallySelected, true);
  assert.equal(targetClaimRecord.targetClaimExecuted, false);
  assert.equal(targetClaimRecord.publicHydrationTargetClaimed, false);
  assert.equal(targetClaimRecord.publicHydrateRootEnabled, false);
  assert.equal(targetClaimRecord.publicHydrationCompatibilityClaimed, false);
  assert.equal(targetClaimRecord.publicHydrationReplayCompatibilityClaimed, false);
  assert.equal(targetClaimRecord.eventDispatch, false);
  assert.equal(targetClaimRecord.compatibilityClaimed, false);
  assert.equal(targetClaimPayload.dispatchRecord, dispatchRecord);
  assert.equal(targetClaimPayload.targetClaimingPayload, claimPayload);
  assert.equal(claimPayload.hydrationBoundaryRecord, hydrateRecord.hydrationBoundaryRecord);
  assert.equal(claimPayload.targetPathResolution.node, target);
  assert.equal(Object.isFrozen(claimPayload.targetPathEvidence), true);
  assert.deepEqual(
    targetClaimRecord.acceptedCapabilities.map((capability) => capability.id),
    [
      "hydrate-root-marker-listener-preflight-required",
      "hydrate-root-lifecycle-request-boundary-required",
      "hydrate-root-target-dispatch-link-diagnostic",
      "hydrate-root-target-claiming-canonical-evidence",
      "hydrate-root-target-claiming-state-unchanged"
    ]
  );
  assert.deepEqual(
    preflight.getHydrateRootTargetClaimingPreflightRecords(),
    [targetClaimRecord]
  );
  assert.equal(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
      .targetClaimingPreflightRecordCount,
    1
  );
  assert.throws(
    () =>
      preflight.preflightTargetClaiming(
        rootBridge.getPrivateHydrateRootPublicFacadePreflightRecordPayload(
          hydrateRecord
        ).requestRecord,
        dispatchRecord
      ),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT",
      message: /marker\/listener/
    }
  );
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);
  assert.equal(dispatchRecord.hydrationReplay.queued, false);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assert.equal(publicBoundary.hydrateRoot.status, "throws");
  assert.equal(publicBoundary.hydrateRoot.rootObjectCreated, false);
});

test("React DOM client private hydrateRoot event replay preflight validates blocked replay only", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const eventListener = require(
    path.join(repoRoot, "packages/react-dom/src/events/react-dom-event-listener.js")
  );
  const eventSystemFlags = require(
    path.join(repoRoot, "packages/react-dom/src/events/event-system-flags.js")
  );
  const pluginEventSystem = require(
    path.join(repoRoot, "packages/react-dom/src/events/plugin-event-system.js")
  );
  const symbol = rootBridge.privateHydrateRootPublicFacadePreflightSymbol;
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.hydrateRoot,
    symbol
  );
  const document = createPrivateGateDocument(
    "public-facade-hydrate-event-replay",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const target = createPrivateGateElement("BUTTON", document, domContainer);
  const start = createPrivateGateCommentNode("$", document, domContainer);
  const end = createPrivateGateCommentNode("/$", document, domContainer);
  start.parentNode = container;
  target.parentNode = container;
  end.parentNode = container;
  container.childNodes = [start, target, end];
  let recoverableErrorCalls = 0;
  const preflight = descriptor.value({
    hydrateIdPrefix: "facade-hydrate-event-replay",
    publicFacadeHydratePreflightIdPrefix:
      "facade-hydrate-event-replay-preflight",
    requestIdPrefix: "facade-hydrate-event-replay-request"
  });
  const hydrateRecord = preflight.hydrateRoot(
    container,
    {
      props: {
        children: "event replay"
      },
      type: "App"
    },
    {
      identifierPrefix: "hydrate-event-replay-",
      onRecoverableError() {
        recoverableErrorCalls++;
      }
    }
  );
  const wrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      "click",
      eventSystemFlags.IS_CAPTURE_PHASE
    );
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      wrapper,
      {
        target,
        type: "click"
      }
    );
  const targetClaimRecord = preflight.preflightTargetClaiming(
    hydrateRecord,
    dispatchRecord,
    {
      source: "conformance-hydrate-root-event-replay-target-claiming"
    }
  );
  const eventReplayRecord = preflight.preflightEventReplay(
    targetClaimRecord,
    {
      source: "conformance-hydrate-root-event-replay"
    }
  );
  const eventReplayPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload(
      eventReplayRecord
    );
  const executionPayload =
    rootBridge.getPrivateHydrationClaimedReplayTargetDispatchExecutionPayload(
      eventReplayRecord.replayExecutionRecord
    );

  assert.equal(
    eventReplayRecord.preflightStatus,
    rootBridge.ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_EVENT_REPLAY_PREFLIGHTED
  );
  assert.equal(Object.isFrozen(eventReplayRecord), true);
  assert.equal(
    rootBridge.isPrivateHydrateRootPublicFacadeEventReplayPreflightRecord(
      eventReplayRecord
    ),
    true
  );
  assert.equal(eventReplayRecord.markerListenerPreflight, hydrateRecord.markerListenerPreflight);
  assert.equal(eventReplayRecord.targetClaimingPreflight, targetClaimRecord);
  assert.equal(eventReplayRecord.preconditions.markerListenerPreflightRequired, true);
  assert.equal(eventReplayRecord.preconditions.targetClaimingPreflightRequired, true);
  assert.equal(eventReplayRecord.preconditions.canonicalReplayExecutionMetadata, true);
  assert.equal(eventReplayRecord.dispatchRecord, dispatchRecord);
  assert.equal(eventReplayRecord.dispatchRecordStatus, "blocked");
  assert.equal(eventReplayRecord.targetPath, "container.childNodes[1]");
  assert.equal(eventReplayRecord.markerPath, "container.childNodes[0]");
  assert.equal(eventReplayRecord.targetDispatchExecuted, false);
  assert.equal(eventReplayRecord.eventReplayDispatchAttempted, false);
  assert.equal(eventReplayRecord.nativeEventRedispatched, false);
  assert.equal(eventReplayRecord.syntheticEventCreated, false);
  assert.equal(eventReplayRecord.listenerInvocationCount, 0);
  assert.equal(eventReplayRecord.hydrateInstanceCalled, false);
  assert.equal(eventReplayRecord.rootScheduled, false);
  assert.equal(eventReplayRecord.suspenseHydrationScheduled, false);
  assert.equal(eventReplayRecord.replayQueueDrained, false);
  assert.equal(eventReplayRecord.replayQueuesDrained, false);
  assert.equal(eventReplayRecord.clickReplayDispatchDiagnosticRecorded, true);
  assert.equal(eventReplayRecord.clickReplayDispatchDiagnosticBlocked, true);
  assert.equal(eventReplayRecord.recoverableErrorsQueued, false);
  assert.equal(eventReplayRecord.onRecoverableErrorInvoked, false);
  assert.equal(eventReplayRecord.publicOnRecoverableErrorInvoked, false);
  assert.equal(recoverableErrorCalls, 0);
  assert.equal(eventReplayRecord.publicHydrateRootEnabled, false);
  assert.equal(eventReplayRecord.publicHydrationTargetClaimed, false);
  assert.equal(eventReplayRecord.publicHydrationCompatibilityClaimed, false);
  assert.equal(eventReplayRecord.publicHydrationReplayCompatibilityClaimed, false);
  assert.equal(eventReplayRecord.eventDispatch, false);
  assert.equal(eventReplayRecord.compatibilityClaimed, false);
  assert.deepEqual(
    eventReplayRecord.acceptedCapabilities.map((capability) => capability.id),
    [
      "hydrate-root-marker-listener-preflight-required",
      "hydrate-root-lifecycle-request-boundary-required",
      "hydrate-root-target-claiming-preflight-required",
      "hydrate-root-replay-target-dispatch-execution-metadata",
      "hydrate-root-replay-blocker-currentness",
      "hydrate-root-event-replay-state-unchanged"
    ]
  );
  assert.equal(eventReplayPayload.preflight, preflight);
  assert.equal(eventReplayPayload.targetClaimingPreflight, targetClaimRecord);
  assert.equal(eventReplayPayload.replayExecutionPayload, executionPayload);
  assert.equal(executionPayload.dispatchRecord, dispatchRecord);
  assert.deepEqual(preflight.getHydrateRootEventReplayPreflightRecords(), [
    eventReplayRecord
  ]);
  assert.equal(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
      .eventReplayPreflightRecordCount,
    1
  );
  assert.throws(
    () => preflight.preflightEventReplay(Object.freeze({...targetClaimRecord})),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT",
      message: /target-claiming/
    }
  );
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);
  assert.equal(dispatchRecord.hydrationReplay.queued, false);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assert.equal(publicBoundary.hydrateRoot.status, "throws");
  assert.equal(publicBoundary.hydrateRoot.rootObjectCreated, false);
});

test("React DOM client private hydrateRoot execution preflight consumes blocked event replay metadata only", () => {
  const recoverableErrorCalls = [];
  const {
    container,
    dispatchRecord,
    document,
    eventReplayRecord,
    preflight,
    rootBridge
  } = createHydrateRootExecutionPreflightScenario(
    "public-facade-hydrate-execution",
    {
      onRecoverableError(error) {
        recoverableErrorCalls.push(error);
      }
    }
  );
  const executionRecord = preflight.preflightExecution(eventReplayRecord, {
    source: "conformance-hydrate-root-execution-preflight"
  });
  const executionPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeExecutionPreflightPayload(
      executionRecord
    );
  const eventReplayPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload(
      eventReplayRecord
    );
  const replayExecutionPayload =
    rootBridge.getPrivateHydrationClaimedReplayTargetDispatchExecutionPayload(
      eventReplayRecord.replayExecutionRecord
    );
  const preflightPayload =
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight);

  assert.equal(Object.isFrozen(executionRecord), true);
  assert.equal(
    executionRecord.$$typeof,
    rootBridge.privateHydrateRootPublicFacadeExecutionPreflightRecordType
  );
  assert.equal(
    executionRecord.kind,
    "FastReactDomPrivateHydrateRootPublicFacadeExecutionPreflightRecord"
  );
  assert.equal(
    executionRecord.preflightStatus,
    rootBridge
      .ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_EXECUTION_PREFLIGHTED
  );
  assert.equal(
    rootBridge.isPrivateHydrateRootPublicFacadeExecutionPreflightRecord(
      executionRecord
    ),
    true
  );
  assert.equal(
    executionRecord.executionPreflightId,
    "public-facade-hydrate-execution-preflight:1:execution:1"
  );
  assert.equal(executionRecord.executionStatus, rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED);
  assert.equal(executionRecord.privateExecutionPreflight, true);
  assert.equal(executionRecord.privateExecution, false);
  assert.equal(executionRecord.executionPreflightAccepted, true);
  assert.equal(executionRecord.eventReplayPreflight, eventReplayRecord);
  assert.equal(
    executionRecord.replayExecutionRecord,
    eventReplayRecord.replayExecutionRecord
  );
  assert.equal(executionRecord.preconditions.eventReplayPreflightRequired, true);
  assert.equal(executionRecord.preconditions.eventReplayPreflightAccepted, true);
  assert.equal(
    executionRecord.preconditions.replayExecutionRecordFromEventReplayPreflight,
    true
  );
  assert.equal(executionRecord.preconditions.canonicalReplayExecutionMetadata, true);
  assert.equal(executionRecord.preconditions.stateUnchanged, true);
  assert.equal(executionRecord.targetDispatchExecuted, false);
  assert.equal(executionRecord.eventReplayDispatchAttempted, false);
  assert.equal(executionRecord.listenerInvocationCount, 0);
  assert.equal(executionRecord.replayQueueDrained, false);
  assert.equal(executionRecord.replayQueuesDrained, false);
  assert.equal(executionRecord.recoverableErrorsQueued, false);
  assert.equal(executionRecord.onRecoverableErrorInvoked, false);
  assert.equal(executionRecord.publicOnRecoverableErrorInvoked, false);
  assert.equal(executionRecord.publicHydrateRootEnabled, false);
  assert.equal(executionRecord.publicHydrateRootSupported, false);
  assert.equal(executionRecord.publicRootObjectExposed, false);
  assert.equal(executionRecord.nativeExecution, false);
  assert.equal(executionRecord.reconcilerExecution, false);
  assert.equal(executionRecord.domMutation, false);
  assert.equal(executionRecord.hydration, false);
  assert.equal(executionRecord.eventDispatch, false);
  assert.equal(executionRecord.compatibilityClaimed, false);
  assert.deepEqual(
    executionRecord.acceptedCapabilities.map((capability) => capability.id),
    [
      "hydrate-root-event-replay-preflight-required",
      "hydrate-root-lifecycle-request-boundary-required",
      "hydrate-root-replay-execution-boundary-canonical",
      "hydrate-root-target-claiming-boundary-retained",
      "hydrate-root-recoverable-error-preflight-retained",
      "hydrate-root-execution-preflight-state-unchanged"
    ]
  );
  assert.equal(executionPayload.preflight, preflight);
  assert.equal(executionPayload.eventReplayPreflight, eventReplayRecord);
  assert.equal(executionPayload.eventReplayPayload, eventReplayPayload);
  assert.equal(
    executionPayload.replayExecutionRecord,
    eventReplayRecord.replayExecutionRecord
  );
  assert.equal(executionPayload.replayExecutionPayload, replayExecutionPayload);
  assert.deepEqual(preflight.getHydrateRootExecutionPreflightRecords(), [
    executionRecord
  ]);
  assert.deepEqual(preflightPayload.executionPreflightRecords, [
    executionRecord
  ]);
  assert.equal(preflightPayload.executionPreflightRecordCount, 1);
  assertHydrateRootPreflightEvidenceBlocked([
    eventReplayRecord.replayExecutionRecord,
    eventReplayRecord,
    executionRecord
  ]);
  assert.equal(recoverableErrorCalls.length, 0);
  assert.equal(dispatchRecord.hydrationReplay.queued, false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assert.equal(publicBoundary.hydrateRoot.status, "throws");
  assert.equal(publicBoundary.hydrateRoot.rootObjectCreated, false);
});

test("React DOM client private hydrateRoot post-preflight execution applies fake text patch only", () => {
  const recoverableErrorCalls = [];
  const {
    container,
    dispatchRecord,
    document,
    eventReplayRecord,
    hydrateRecord,
    hydrationOptions,
    preflight,
    rootBridge,
    textNode
  } = createHydrateRootExecutionPreflightScenario(
    "public-facade-hydrate-text-claim-patch",
    {
      onRecoverableError(error) {
        recoverableErrorCalls.push(error);
      },
      textMismatch: true
    }
  );
  const executionRecord = preflight.preflightExecution(eventReplayRecord, {
    source: "conformance-hydrate-root-text-claim-patch-preflight"
  });
  const mismatchRow = hydrateRecord.textMismatchDiagnostics.mismatchRows[0];
  const bridgeExecution = preflight.postPreflightExecution(
    executionRecord,
    {
      claimLabel: "conformance-text",
      hydrationOptions,
      mismatchRow,
      source: "conformance-hydrate-root-text-claim-patch"
    }
  );
  const bridgePayload =
    rootBridge
      .getPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionPayload(
        bridgeExecution
      );
  const textPatchRecord =
    bridgeExecution.textNodeClaimPatchExecutionRecord;
  const textPatchPayload =
    rootBridge.getPrivateHydrationTextNodeClaimPatchExecutionPayload(
      textPatchRecord
    );
  const preflightPayload =
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(
      preflight
    );
  const lifecycleRequestBoundary =
    bridgeExecution.lifecycleRequestBoundary;
  const lifecyclePayload =
    rootBridge
      .getPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryPayload(
        lifecycleRequestBoundary
      );

  assert.equal(Object.isFrozen(bridgeExecution), true);
  assert.equal(
    bridgeExecution.$$typeof,
    rootBridge
      .privateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecordType
  );
  assert.equal(
    bridgeExecution.executionStatus,
    rootBridge
      .ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_TEXT_NODE_CLAIM_PATCH_EXECUTED
  );
  assert.equal(
    rootBridge
      .isPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecord(
        bridgeExecution
      ),
    true
  );
  assert.equal(bridgeExecution.executionPreflight, executionRecord);
  assert.equal(bridgeExecution.privateExecution, true);
  assert.equal(bridgeExecution.fakeDomMutation, true);
  assert.equal(bridgeExecution.fakeTextNodeClaimed, true);
  assert.equal(bridgeExecution.fakeTextNodePatched, true);
  assert.equal(bridgeExecution.textPatchApplied, true);
  assert.equal(bridgeExecution.actualTextBefore, "server text");
  assert.equal(bridgeExecution.actualTextAfter, "client text");
  assert.equal(bridgeExecution.expectedPath, "initialChildren.props.children");
  assert.equal(bridgeExecution.actualPath, "container.childNodes[2]");
  assert.equal(bridgeExecution.claimLabel, "conformance-text");
  assert.equal(bridgeExecution.publicHydrateRootEnabled, false);
  assert.equal(bridgeExecution.publicHydrateRootSupported, false);
  assert.equal(bridgeExecution.publicRootObjectExposed, false);
  assert.equal(bridgeExecution.nativeExecution, false);
  assert.equal(bridgeExecution.reconcilerExecution, false);
  assert.equal(bridgeExecution.domMutation, false);
  assert.equal(bridgeExecution.browserDomMutated, false);
  assert.equal(bridgeExecution.hydration, false);
  assert.equal(bridgeExecution.eventDispatch, false);
  assert.equal(bridgeExecution.recoverableErrorsQueued, false);
  assert.equal(bridgeExecution.onRecoverableErrorInvoked, false);
  assert.equal(bridgeExecution.publicOnRecoverableErrorInvoked, false);
  assert.equal(bridgeExecution.compatibilityClaimed, false);
  assert.deepEqual(
    bridgeExecution.acceptedCapabilities.map((capability) => capability.id),
    [
      "hydrate-root-execution-preflight-required",
      "hydrate-root-lifecycle-request-boundary-required",
      "hydrate-root-text-node-claim-patch-execution-record",
      "hydrate-root-text-node-claim-patch-options-owned",
      "hydrate-root-text-node-claim-patch-state-unchanged"
    ]
  );
  assert.equal(bridgeExecution.lifecycleRequestBoundaryAccepted, true);
  assert.equal(bridgeExecution.lifecycleRequestBoundarySourceOwned, true);
  assert.equal(bridgeExecution.lifecycleContainerSnapshotOwned, true);
  assert.equal(
    rootBridge
      .isPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryRecord(
        lifecycleRequestBoundary
      ),
    true
  );
  assert.equal(bridgePayload.lifecycleRequestBoundary, lifecycleRequestBoundary);
  assert.equal(
    lifecycleRequestBoundary.boundaryStatus,
    rootBridge
      .ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_LIFECYCLE_BOUNDARY_ACCEPTED
  );
  assert.equal(lifecycleRequestBoundary.sourceOwned, true);
  assert.equal(lifecycleRequestBoundary.active, true);
  assert.equal(
    lifecycleRequestBoundary.sourceTokenOwnership,
    "weakmap-root-bridge-admission"
  );
  assert.equal(lifecycleRequestBoundary.requestId, hydrateRecord.requestId);
  assert.equal(
    lifecycleRequestBoundary.requestSequence,
    hydrateRecord.requestSequence
  );
  assert.equal(
    lifecycleRequestBoundary.requestType,
    hydrateRecord.requestType
  );
  assert.equal(lifecycleRequestBoundary.hydrateId, hydrateRecord.hydrateId);
  assert.equal(lifecycleRequestBoundary.rootId, hydrateRecord.rootId);
  assert.equal(lifecycleRequestBoundary.rootKind, hydrateRecord.rootKind);
  assert.equal(lifecycleRequestBoundary.rootTag, hydrateRecord.rootTag);
  assert.equal(
    lifecycleRequestBoundary.requestAdmission,
    hydrateRecord.requestAdmission
  );
  assert.equal(
    lifecycleRequestBoundary.requestAdmissionStatus,
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
  );
  assert.equal(
    lifecycleRequestBoundary.hydrationBoundaryRecord,
    hydrateRecord.hydrationBoundaryRecord
  );
  assert.equal(
    lifecycleRequestBoundary.lifecycleContainerSnapshot,
    bridgeExecution.lifecycleContainerSnapshot
  );
  assert.equal(
    lifecyclePayload.lifecycleContainerSnapshot,
    lifecycleRequestBoundary.lifecycleContainerSnapshot
  );
  assert.equal(lifecyclePayload.preflight, preflight);
  assert.equal(lifecyclePayload.requestRecord, bridgePayload.requestRecord);
  assert.equal(
    lifecyclePayload.requestAdmission,
    hydrateRecord.requestAdmission
  );
  assert.equal(lifecyclePayload.container, container);
  for (const field of hydrateRootLifecycleBoundaryBlockedFields) {
    assert.equal(lifecycleRequestBoundary[field], false, field);
  }
  assert.equal(
    rootBridge.isPrivateHydrationTextNodeClaimPatchExecutionRecord(
      textPatchRecord
    ),
    true
  );
  assert.equal(
    textPatchRecord.kind,
    rootBridge.HYDRATION_TEXT_NODE_CLAIM_PATCH_EXECUTION_RECORD_KIND
  );
  assert.equal(textPatchRecord.textMismatchRow, mismatchRow);
  assert.equal(textPatchRecord.patchWriteProperty, "nodeValue");
  assert.deepEqual(textNode.writeLog, [["nodeValue", "client text"]]);
  assert.equal(textNode.textContent, "client text");
  assert.equal(textPatchPayload.hydrationBoundaryRecord, hydrateRecord.hydrationBoundaryRecord);
  assert.equal(textPatchPayload.mismatchRow, mismatchRow);
  assert.equal(bridgePayload.preflight, preflight);
  assert.equal(bridgePayload.executionPreflight, executionRecord);
  assert.equal(
    bridgePayload.textNodeClaimPatchExecutionPayload,
    textPatchPayload
  );
  assert.deepEqual(
    preflight.getHydrateRootTextNodeClaimPatchExecutionRecords(),
    [bridgeExecution]
  );
  assert.deepEqual(
    preflightPayload.textNodeClaimPatchExecutionRecords,
    [bridgeExecution]
  );
  assert.deepEqual(
    preflightPayload.lifecycleRequestBoundaryRecords,
    [lifecycleRequestBoundary]
  );
  assert.equal(preflightPayload.lifecycleRequestBoundaryRecordCount, 1);
  assert.equal(preflightPayload.textNodeClaimPatchExecutionRecordCount, 1);
  assertHydrateRootPreflightEvidenceBlocked([
    eventReplayRecord.replayExecutionRecord,
    eventReplayRecord,
    executionRecord
  ]);
  assert.equal(recoverableErrorCalls.length, 0);
  assert.equal(dispatchRecord.hydrationReplay.queued, false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assert.equal(publicBoundary.hydrateRoot.status, "throws");
  assert.equal(publicBoundary.hydrateRoot.rootObjectCreated, false);
});

test("React DOM client private hydrateRoot post-preflight execution consumes a text patch preflight once", () => {
  const {
    eventReplayRecord,
    hydrateRecord,
    hydrationOptions,
    preflight,
    rootBridge,
    textNodes
  } = createHydrateRootExecutionPreflightScenario(
    "public-facade-hydrate-text-claim-patch-one-shot",
    {
      textMismatchRows: true
    }
  );
  const executionRecord = preflight.preflightExecution(eventReplayRecord, {
    source: "conformance-hydrate-root-text-claim-patch-one-shot"
  });
  const mismatchRows = hydrateRecord.textMismatchDiagnostics.mismatchRows;

  assert.equal(mismatchRows.length, 2);
  const bridgeExecution = preflight.postPreflightExecution(
    executionRecord,
    {
      hydrationOptions,
      mismatchRow: mismatchRows[0]
    }
  );
  assert.equal(bridgeExecution.textPatchApplied, true);
  assert.equal(textNodes[0].textContent, "client text one");
  assert.equal(textNodes[1].textContent, "server text two");

  assert.throws(
    () =>
      preflight.postPreflightExecution(executionRecord, {
        hydrationOptions,
        mismatchRow: mismatchRows[1]
      }),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT"
    }
  );
  assert.equal(textNodes[1].textContent, "server text two");
  assert.equal(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
      .textNodeClaimPatchExecutionRecordCount,
    1
  );
});

test("React DOM client private hydrateRoot post-preflight execution rejects noncanonical records", () => {
  const {
    eventReplayRecord,
    hydrateRecord,
    hydrationOptions,
    preflight,
    rootBridge,
    targetClaimRecord,
    textNode
  } = createHydrateRootExecutionPreflightScenario(
    "public-facade-hydrate-text-claim-patch-negative",
    {
      textMismatch: true
    }
  );
  const executionPreflightRecord = preflight.preflightExecution(
    eventReplayRecord
  );

  assert.throws(
    () => preflight.postPreflightExecution(eventReplayRecord),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT"
    }
  );
  assert.throws(
    () =>
      preflight.postPreflightExecution(
        Object.freeze({...executionPreflightRecord})
      ),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT"
    }
  );
  assert.throws(
    () =>
      preflight.postPreflightExecution(
        Object.freeze({
          ...executionPreflightRecord,
          publicHydrateRootSupported: true
        })
      ),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT"
    }
  );
  assert.throws(
    () =>
      preflight.postPreflightExecution(executionPreflightRecord, {
        hydrationOptions: {}
      }),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT"
    }
  );
  const executionPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeExecutionPreflightPayload(
      executionPreflightRecord
    );
  const lifecycleRequestBoundary =
    executionPayload.lifecycleRequestBoundary;
  const mismatchRow = hydrateRecord.textMismatchDiagnostics.mismatchRows[0];
  assert.throws(
    () =>
      preflight.postPreflightExecution(executionPreflightRecord, {
        hydrationOptions,
        lifecycleRequestBoundary: Object.freeze({
          ...lifecycleRequestBoundary
        }),
        mismatchRow
      }),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT"
    }
  );
  assert.throws(
    () =>
      preflight.postPreflightExecution(executionPreflightRecord, {
        hydrationOptions,
        lifecycleContainerSnapshot: Object.freeze({
          ...lifecycleRequestBoundary.lifecycleContainerSnapshot
        }),
        mismatchRow
      }),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT"
    }
  );
  assert.throws(
    () =>
      preflight.postPreflightExecution(executionPreflightRecord, {
        hydrationOptions,
        lifecycleRequestBoundary:
          "hydrate-root-lifecycle-request-boundary-required",
        mismatchRow
      }),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT"
    }
  );
  assert.throws(
    () => preflight.postPreflightExecution(targetClaimRecord),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT"
    }
  );

  const foreign =
    createHydrateRootExecutionPreflightScenario(
      "public-facade-hydrate-text-claim-patch-foreign",
      {
        textMismatch: true
      }
    );
  const foreignExecutionRecord = foreign.preflight.preflightExecution(
    foreign.eventReplayRecord
  );
  assert.throws(
    () => preflight.postPreflightExecution(foreignExecutionRecord),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT"
    }
  );
  const foreignExecutionPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeExecutionPreflightPayload(
      foreignExecutionRecord
    );
  assert.throws(
    () =>
      preflight.postPreflightExecution(executionPreflightRecord, {
        hydrationOptions,
        lifecycleRequestBoundary:
          foreignExecutionPayload.lifecycleRequestBoundary,
        mismatchRow
      }),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT"
    }
  );
  assert.equal(textNode.textContent, "server text");

  const bridgeExecution = preflight.postPreflightExecution(
    executionPreflightRecord,
    {
      hydrationOptions,
      mismatchRow
    }
  );
  assert.equal(bridgeExecution.textPatchApplied, true);
  assert.throws(
    () => preflight.postPreflightExecution(executionPreflightRecord),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT"
    }
  );
  assert.equal(
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
      .textNodeClaimPatchExecutionRecordCount,
    1
  );
});

test("React DOM client private hydrateRoot post-preflight execution rejects older same-container lifecycle evidence", () => {
  const {
    container,
    eventReplayRecord,
    hydrateRecord,
    hydrationOptions,
    initialChildren,
    preflight,
    textNode
  } = createHydrateRootExecutionPreflightScenario(
    "public-facade-hydrate-text-claim-patch-same-container-stale",
    {
      textMismatch: true
    }
  );
  const executionPreflightRecord = preflight.preflightExecution(
    eventReplayRecord
  );
  const mismatchRow = hydrateRecord.textMismatchDiagnostics.mismatchRows[0];
  const newerHydrateRecord = preflight.hydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );

  assert.equal(
    newerHydrateRecord.requestSequence > hydrateRecord.requestSequence,
    true
  );
  assert.throws(
    () =>
      preflight.postPreflightExecution(executionPreflightRecord, {
        hydrationOptions,
        mismatchRow
      }),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT",
      message: /stale same-container lifecycle request-boundary/
    }
  );
  assert.equal(textNode.textContent, "server text");
  assert.equal(preflight.getHydrateRootPreflightRecords().length, 2);
});

test("React DOM client private hydrateRoot execution preflight rejects stale foreign or public execution claims", () => {
  const {
    container,
    dispatchRecord,
    document,
    eventReplayRecord,
    hydrateRecord,
    preflight,
    rootBridge,
    targetClaimRecord
  } = createHydrateRootExecutionPreflightScenario(
    "public-facade-hydrate-execution-negative"
  );

  assert.throws(
    () => preflight.preflightExecution(hydrateRecord),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT",
      message: /event replay/
    }
  );
  assert.throws(
    () => preflight.preflightExecution(Object.freeze({...eventReplayRecord})),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT",
      message: /event replay/
    }
  );
  assert.throws(
    () =>
      preflight.preflightExecution(eventReplayRecord, {
        replayExecutionRecord: Object.freeze({
          ...eventReplayRecord.replayExecutionRecord,
          publicHydrateRootSupported: true
        })
      }),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT",
      message: /public hydration/
    }
  );
  assert.throws(
    () =>
      preflight.preflightExecution(eventReplayRecord, {
        replayExecutionRecord: Object.freeze({
          ...eventReplayRecord.replayExecutionRecord,
          nativeExecution: true
        })
      }),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT",
      message: /execution/
    }
  );

  const foreign =
    createHydrateRootExecutionPreflightScenario(
      "public-facade-hydrate-execution-foreign"
    );
  const baseEventReplayPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload(
      eventReplayRecord
    );
  const foreignEventReplayPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload(
      foreign.eventReplayRecord
    );
  assert.equal(Object.isFrozen(baseEventReplayPayload), true);
  assert.equal(Object.isFrozen(foreignEventReplayPayload), true);
  assert.equal(
    Object.isFrozen(foreignEventReplayPayload.targetClaimingPayload),
    true
  );
  assert.equal(
    Reflect.set(foreignEventReplayPayload, "preflight", preflight),
    false
  );
  assert.equal(
    Reflect.set(
      foreignEventReplayPayload,
      "bridge",
      baseEventReplayPayload.bridge
    ),
    false
  );
  assert.equal(foreignEventReplayPayload.preflight, foreign.preflight);
  assert.notEqual(foreignEventReplayPayload.preflight, preflight);
  assert.notEqual(foreignEventReplayPayload.bridge, baseEventReplayPayload.bridge);
  assert.throws(
    () => preflight.preflightExecution(foreign.eventReplayRecord),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT",
      message: /event replay/
    }
  );
  assert.throws(
    () =>
      preflight.preflightExecution(eventReplayRecord, {
        replayExecutionRecord:
          foreign.eventReplayRecord.replayExecutionRecord
      }),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT",
      message: /accepted replay execution/
    }
  );

  const staleStateBridge = rootBridge.createPrivateRootBridgeShell({
    sideEffectIdPrefix: "hydrate-execution-stale-state"
  });
  const staleStateCreateRecord =
    staleStateBridge.createClientRoot(container);
  const staleStateSideEffects =
    staleStateBridge.applyCreateRootSideEffects(staleStateCreateRecord);
  assert.throws(
    () => preflight.preflightExecution(eventReplayRecord),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT",
      message: /lifecycle container snapshot|current marker\/listener state/
    }
  );
  staleStateBridge.revertCreateRootSideEffects(staleStateSideEffects);

  assert.throws(
    () => preflight.preflightExecution(targetClaimRecord),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT",
      message: /event replay/
    }
  );
  assert.equal(dispatchRecord.hydrationReplay.queued, false);
  assert.equal(foreign.dispatchRecord.hydrationReplay.queued, false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(foreign.container.__registrations.length, 0);
  assert.equal(foreign.document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);
  assert.equal(foreign.container.__mutationLog.length, 0);
  assert.equal(foreign.document.__mutationLog.length, 0);
});

test("React DOM client private hydrateRoot preflight matrix composes blocked evidence only", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const hydrationGate = require(
    path.join(
      repoRoot,
      "packages/react-dom/src/client/hydration-boundary-gate.js"
    )
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const eventListener = require(
    path.join(repoRoot, "packages/react-dom/src/events/react-dom-event-listener.js")
  );
  const eventSystemFlags = require(
    path.join(repoRoot, "packages/react-dom/src/events/event-system-flags.js")
  );
  const pluginEventSystem = require(
    path.join(repoRoot, "packages/react-dom/src/events/plugin-event-system.js")
  );
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.hydrateRoot,
    rootBridge.privateHydrateRootPublicFacadePreflightSymbol
  );
  const document = createPrivateGateDocument(
    "public-facade-hydrate-preflight-matrix",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const target = createPrivateGateElement("BUTTON", document, domContainer);
  const start = createPrivateGateCommentNode("$", document, domContainer);
  const end = createPrivateGateCommentNode("/$", document, domContainer);
  const recoverableErrorCalls = [];
  start.parentNode = container;
  target.parentNode = container;
  end.parentNode = container;
  container.childNodes = [start, target, end];

  const hydrationOptions = {
    identifierPrefix: "hydrate-preflight-matrix-",
    onRecoverableError(error) {
      recoverableErrorCalls.push(error);
    }
  };
  const preflight = descriptor.value({
    hydrateIdPrefix: "facade-hydrate-matrix-root",
    publicFacadeHydratePreflightIdPrefix: "facade-hydrate-matrix",
    requestIdPrefix: "facade-hydrate-matrix-request"
  });
  const hydrateRecord = preflight.hydrateRoot(
    container,
    {
      props: {
        children: "matrix child"
      },
      type: "App"
    },
    hydrationOptions
  );
  const wrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      "click",
      eventSystemFlags.IS_CAPTURE_PHASE
    );
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      wrapper,
      {
        target,
        type: "click"
      }
    );
  const targetClaimRecord = preflight.preflightTargetClaiming(
    hydrateRecord,
    dispatchRecord,
    {
      source: "conformance-hydrate-root-preflight-matrix-target-claim"
    }
  );
  const eventReplayRecord = preflight.preflightEventReplay(
    targetClaimRecord,
    {
      source: "conformance-hydrate-root-preflight-matrix-event-replay"
    }
  );

  const preflightPayload =
    rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(preflight);
  const hydratePayload =
    rootBridge.getPrivateHydrateRootPublicFacadePreflightRecordPayload(
      hydrateRecord
    );
  const markerListenerPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeMarkerListenerPreflightPayload(
      hydrateRecord.markerListenerPreflight
    );
  const recoverableErrorPayload =
    rootBridge
      .getPrivateHydrationTextMismatchRecoverableErrorPreflightPayload(
        hydrateRecord.recoverableErrorPreflight
      );
  const targetClaimPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeTargetClaimingPreflightPayload(
      targetClaimRecord
    );
  const claimPayload =
    rootBridge.getPrivateHydrationTargetClaimingDiagnosticPayload(
      targetClaimRecord.targetClaimingDiagnostic
    );
  const eventReplayPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload(
      eventReplayRecord
    );
  const executionPayload =
    rootBridge.getPrivateHydrationClaimedReplayTargetDispatchExecutionPayload(
      eventReplayRecord.replayExecutionRecord
    );

  assert.deepEqual(preflightPayload.preflightRecords, [hydrateRecord]);
  assert.deepEqual(preflightPayload.markerListenerPreflightRecords, [
    hydrateRecord.markerListenerPreflight
  ]);
  assert.deepEqual(preflightPayload.recoverableErrorPreflightRecords, [
    hydrateRecord.recoverableErrorPreflight
  ]);
  assert.deepEqual(preflightPayload.targetClaimingPreflightRecords, [
    targetClaimRecord
  ]);
  assert.deepEqual(preflightPayload.eventReplayPreflightRecords, [
    eventReplayRecord
  ]);
  assert.equal(hydratePayload.preflight, preflight);
  assert.equal(markerListenerPayload.preflight, preflight);
  assert.equal(markerListenerPayload.requestRecord, hydratePayload.requestRecord);
  assert.equal(markerListenerPayload.container, container);
  assert.equal(markerListenerPayload.preconditions.accepted, true);
  assert.equal(markerListenerPayload.preconditions.stateUnchanged, true);
  assert.equal(
    recoverableErrorPayload.hydrationBoundaryRecord,
    hydrateRecord.hydrationBoundaryRecord
  );
  assert.equal(recoverableErrorPayload.hydrationOptions, hydrationOptions);
  assert.equal(
    recoverableErrorPayload.recoverableErrorMetadata,
    hydrateRecord.recoverableErrorMetadata
  );
  assert.equal(
    recoverableErrorPayload.acceptedBoundaryMetadataDiagnostics,
    hydrateRecord.acceptedPrivateMetadataDiagnostics
  );
  assert.equal(
    hydrateRecord.recoverableErrorPreflight.acceptedBoundaryMetadataRow
      .metadataId,
    hydrationGate.privateHydrationTextMismatchRecoverableErrorRoutingMetadataId
  );
  assert.equal(
    targetClaimPayload.markerListenerPreflight,
    hydrateRecord.markerListenerPreflight
  );
  assert.equal(targetClaimPayload.markerListenerPayload, markerListenerPayload);
  assert.equal(targetClaimPayload.requestRecord, hydratePayload.requestRecord);
  assert.equal(targetClaimPayload.dispatchRecord, dispatchRecord);
  assert.equal(targetClaimPayload.targetClaimingPayload, claimPayload);
  assert.equal(
    claimPayload.hydrationBoundaryRecord,
    hydrateRecord.hydrationBoundaryRecord
  );
  assert.equal(
    claimPayload.targetDispatchLinkDiagnostic,
    targetClaimRecord.targetDispatchLinkDiagnostic
  );
  assert.equal(
    claimPayload.ownershipDiagnostics,
    targetClaimRecord.ownershipDiagnostics
  );
  assert.equal(
    eventReplayPayload.markerListenerPreflight,
    hydrateRecord.markerListenerPreflight
  );
  assert.equal(eventReplayPayload.targetClaimingPreflight, targetClaimRecord);
  assert.equal(eventReplayPayload.targetClaimingPayload, targetClaimPayload);
  assert.equal(eventReplayPayload.replayExecutionPayload, executionPayload);
  assert.equal(executionPayload.dispatchRecord, dispatchRecord);
  assert.equal(
    executionPayload.hydrationBoundaryRecord,
    hydrateRecord.hydrationBoundaryRecord
  );
  assert.equal(
    executionPayload.targetClaimingDiagnostic,
    targetClaimRecord.targetClaimingDiagnostic
  );
  assert.equal(executionPayload.targetClaimingDiagnosticPayload, claimPayload);
  assert.equal(
    executionPayload.targetDispatchLinkPayload,
    claimPayload.targetDispatchLinkPayload
  );
  assert.equal(
    executionPayload.recoverableErrorMetadata,
    hydrateRecord.recoverableErrorMetadata
  );
  assert.equal(
    executionPayload.clickReplayDispatchDiagnosticPayload.dispatchRecord,
    dispatchRecord
  );

  assertHydrateRootPreflightEvidenceBlocked([
    hydrateRecord,
    hydrateRecord.markerListenerPreflight,
    hydrateRecord.recoverableErrorPreflight,
    targetClaimRecord.targetDispatchLinkDiagnostic,
    targetClaimRecord.ownershipDiagnostics,
    targetClaimRecord.targetClaimingDiagnostic,
    targetClaimRecord,
    eventReplayRecord.replayExecutionRecord,
    eventReplayRecord
  ]);
  assert.equal(eventReplayRecord.replayQueueDrained, false);
  assert.equal(eventReplayRecord.replayQueuesDrained, false);
  assert.equal(eventReplayRecord.listenerInvocationCount, 0);
  assert.equal(recoverableErrorCalls.length, 0);
  assert.equal(dispatchRecord.hydrationReplay.queued, false);

  assert.throws(
    () => preflight.preflightTargetClaiming(hydratePayload.requestRecord, dispatchRecord),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT",
      message: /marker\/listener/
    }
  );
  assert.throws(
    () => preflight.preflightEventReplay(hydrateRecord),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT",
      message: /target-claiming/
    }
  );
  assert.throws(
    () => preflight.preflightEventReplay(Object.freeze({...targetClaimRecord})),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT",
      message: /target-claiming/
    }
  );
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assert.equal(publicBoundary.hydrateRoot.status, "throws");
  assert.equal(publicBoundary.hydrateRoot.rootObjectCreated, false);
});

test("React DOM client private facade preflights marker/listener setup and cleanup without public behavior", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const rootListeners = require(
    path.join(repoRoot, "packages/react-dom/src/events/root-listeners.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const symbol = rootBridge.privateRootPublicFacadeAdapterSymbol;
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    symbol
  );
  const document = createPrivateGateDocument(
    "public-facade-marker-listener-preflight",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const adapter = descriptor.value({
    publicFacadePreflightIdPrefix: "facade-marker-listener-preflight",
    requestIdPrefix: "facade-preflight-request",
    rootIdPrefix: "facade-preflight-root",
    sideEffectIdPrefix: "facade-preflight-side-effect"
  });
  const root = adapter.createRoot(container);
  const preflight =
    adapter.preflightRootMarkerListenerSetupAndCleanup(root);

  assert.equal(
    preflight.preflightStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_MARKER_LISTENER_PREFLIGHTED
  );
  assert.equal(preflight.preflightId, "facade-marker-listener-preflight:1");
  assert.deepEqual(
    preflight.acceptedCapabilities.map((capability) => capability.id),
    [
      "public-facade-create-root-record",
      "root-marker-setup-cleanup",
      "root-listener-setup-cleanup"
    ]
  );
  assert.equal(preflight.setupPrerequisites.rootMarkerMatchesOwner, true);
  assert.equal(preflight.setupPrerequisites.rootListeningMarkerPresent, true);
  assert.equal(
    preflight.setupPrerequisites.ownerDocumentListeningMarkerPresent,
    true
  );
  assert.equal(preflight.setupPrerequisites.listenerRegistrationCount, 139);
  assert.equal(
    preflight.cleanupPrerequisites.markerCleanupStatus,
    rootMarkers.ROOT_MARKER_REVERTED
  );
  assert.equal(
    preflight.cleanupPrerequisites.listenerCleanupStatus,
    rootListeners.ROOT_LISTENERS_REVERTED
  );
  assert.equal(preflight.cleanupPrerequisites.listenerRemovalCount, 139);
  assert.equal(
    preflight.cleanupPrerequisites.restoredInitialMarkerState,
    true
  );
  assert.equal(preflight.publicCreateRootEnabled, false);
  assert.equal(preflight.publicRootExecution, false);
  assert.equal(preflight.nativeExecution, false);
  assert.equal(preflight.reconcilerExecution, false);
  assert.equal(preflight.domMutation, false);
  assert.equal(preflight.markerWrites, false);
  assert.equal(preflight.listenerInstallation, false);
  assert.equal(preflight.eventDispatch, false);
  assert.equal(preflight.compatibilityClaimed, false);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assertMinimalPublicCreateRootBoundary(publicBoundary);
});

test("React DOM client private facade preflight accepts live containers only as blocked evidence", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const symbol = rootBridge.privateRootPublicFacadePreflightSymbol;
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    symbol
  );
  const { container, document } = createPrivateGateLiveRootContainer(
    "public-facade-live-container-preflight",
    domContainer
  );
  const preflight = descriptor.value({
    rootLiveContainerPreflightIdPrefix: "facade-live-container"
  });

  const record = preflight.preflightLiveContainer(container, {
    containerId: "facade-live-container:target",
    explicitAdmission: true
  });
  const payload =
    rootBridge.getPrivateRootLiveContainerPreflightPayload(record);

  assert.equal(
    record.preflightStatus,
    rootBridge.ROOT_BRIDGE_LIVE_CONTAINER_PREFLIGHT_BLOCKED
  );
  assert.equal(record.preflightId, "facade-live-container:1");
  assert.equal(record.liveContainerAcceptedForPreflight, true);
  assert.equal(record.liveContainerCaptured, false);
  assert.equal(record.publicCreateRootEnabled, false);
  assert.equal(record.publicRootExecution, false);
  assert.equal(record.nativeExecution, false);
  assert.equal(record.reconcilerExecution, false);
  assert.equal(record.rootScheduled, false);
  assert.equal(record.domMutation, false);
  assert.equal(record.fakeDomMutation, false);
  assert.equal(record.browserDomMutation, false);
  assert.equal(record.markerWrites, false);
  assert.equal(record.listenerInstallation, false);
  assert.equal(record.eventDispatch, false);
  assert.equal(record.compatibilityClaimed, false);
  assert.deepEqual(
    record.acceptedCapabilities.map((capability) => capability.id),
    [
      "dom-like-live-container-shape",
      "root-marker-listener-state-snapshot",
      "blocked-live-container-evidence"
    ]
  );
  assert.deepEqual(
    record.blockedCapabilities.map((capability) => capability.id),
    [
      "public-root-execution",
      "native-execution",
      "reconciler-execution",
      "marker-writes",
      "listener-installation",
      "browser-dom-mutation",
      "fake-dom-mutation",
      "hydration",
      "events",
      "compatibility-claims"
    ]
  );
  assert.equal(record.blockerEvidence.markerStateUnchanged, true);
  assert.equal(record.blockerEvidence.markerWritesBlocked, true);
  assert.equal(record.blockerEvidence.listenerInstallationBlocked, true);
  assert.equal(record.blockerEvidence.browserDomMutationBlocked, true);
  assert.equal(record.blockerEvidence.fakeDomMutationBlocked, true);
  assert.equal(record.blockerEvidence.rootMutationCountBefore, 0);
  assert.equal(record.blockerEvidence.rootMutationCountAfter, 0);
  assert.equal(
    record.blockerEvidence.ownerDocumentMutationCountBefore,
    0
  );
  assert.equal(record.blockerEvidence.ownerDocumentMutationCountAfter, 0);
  assert.equal(payload.container, undefined);
  assert.equal(payload.ownerDocument, undefined);
  assert.equal(payload.record, record);
  assert.deepEqual(preflight.getLiveContainerPreflightRecords(), [record]);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assertMinimalPublicCreateRootBoundary(publicBoundary);
});

test("React DOM private root-render host-output evidence stays behind public facade block", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domHost = require(
    path.join(repoRoot, "packages/react-dom/src/dom-host/mutation.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const document = createPrivateGateDocument(
    "private-root-render-host-output",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const publicContainer = createPrivateGateElement(
    "DIV",
    createPrivateGateDocument(
      "private-root-render-host-output-public",
      domContainer
    ),
    domContainer
  );
  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: "conformance-root-render-admission",
    initialHostOutputIdPrefix: "conformance-root-render-initial",
    requestIdPrefix: "conformance-root-render-request",
    rootIdPrefix: "conformance-root-render-root",
    rootRenderHostOutputIdPrefix: "conformance-root-render-host-output",
    sideEffectIdPrefix: "conformance-root-render-side-effect",
    updateIdPrefix: "conformance-root-render-update"
  });
  const element = {
    props: {
      children: "private root render output",
      id: "private-root-render-host",
      title: "Private root render"
    },
    type: "section"
  };
  const create = bridge.createClientRoot(container);
  const metadata = createPrivateGateRootWorkLoopFinishedWorkMetadata(
    rootBridge,
    {
      rootId: create.rootId,
      rootTag: create.rootTag,
      renderUpdateId: "conformance-root-render-update:1",
      hostType: "section",
      textContent: "private root render output"
    }
  );

  const record = bridge.renderRootHostOutput(create, element, {
    acceptedRootWorkLoopFinishedWorkMetadata: metadata
  });
  const hidden = rootBridge.getPrivateRootRenderHostOutputPayload(record);
  const finishedWork = record.rootWorkLoopFinishedWorkRecord;

  assert.equal(
    record.$$typeof,
    rootBridge.privateRootRenderHostOutputRecordType
  );
  assert.equal(
    record.renderStatus,
    rootBridge.ROOT_BRIDGE_ROOT_RENDER_HOST_OUTPUT_APPLIED
  );
  assert.equal(
    finishedWork.$$typeof,
    rootBridge.privateRootRenderHostOutputFinishedWorkRecordType
  );
  assert.equal(
    finishedWork.handoffStatus,
    rootBridge.ROOT_BRIDGE_ROOT_RENDER_HOST_OUTPUT_FINISHED_WORK_ACCEPTED
  );
  assert.deepEqual(record.childTags, ["HostComponent", "HostText"]);
  assert.equal(record.rootWorkLoopFinishedWorkConsumed, true);
  assert.equal(record.rootWorkLoopPublicRootRenderingBlocked, true);
  assert.equal(record.rustHostOutputMetadataAccepted, true);
  assert.equal(
    record.domHostMutationGateMetadata,
    domHost.DOM_ROOT_RENDER_HOST_OUTPUT_MUTATION_GATE_METADATA
  );
  assert.deepEqual(
    record.acceptedCapabilities.map((capability) => capability.id),
    [
      "private-create-root-record",
      "private-root-render-record",
      "root-marker-setup-cleanup",
      "root-listener-setup-cleanup",
      "create-render-admission",
      "root-work-loop-finished-work-handoff",
      "fake-dom-host-output-mutation",
      "component-tree-host-instance-map",
      "latest-props-publication"
    ]
  );
  assert.equal(record.publicCreateRootEnabled, false);
  assert.equal(record.publicRootCreated, false);
  assert.equal(record.publicRootObjectExposed, false);
  assert.equal(record.publicRootExecution, false);
  assert.equal(record.publicRootRenderCompatibilityClaimed, false);
  assert.equal(record.nativeExecution, false);
  assert.equal(record.reconcilerExecution, false);
  assert.equal(record.browserDomMutation, false);
  assert.equal(record.hydration, false);
  assert.equal(record.eventDispatch, false);
  assert.equal(record.compatibilityClaimed, false);
  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild.nodeName, "SECTION");
  assert.equal(container.textContent, "private root render output");
  assert.deepEqual(attributeEntries(container.firstChild), [
    ["id", "private-root-render-host"],
    ["title", "Private root render"]
  ]);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(
    rootBridge.isPrivateRootRenderHostOutputRecord(record),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootRenderHostOutputFinishedWorkRecord(finishedWork),
    true
  );
  assert.equal(hidden.createRecord, create);
  assert.equal(
    hidden.renderRecord.updateId,
    "conformance-root-render-update:1"
  );
  assert.equal(hidden.rootWorkLoopFinishedWorkRecord, finishedWork);

  const publicRoot = reactDomClient.createRoot(publicContainer);
  assert.deepEqual(Object.keys(publicRoot), ["render", "unmount"]);
  assert.throws(() => publicRoot.render(element), {
    code: "FAST_REACT_UNIMPLEMENTED",
    entrypoint: "react-dom/client",
    exportName: "createRoot().render"
  });
  assert.equal(publicContainer.childNodes.length, 0);
  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assertMinimalPublicCreateRootBoundary(publicBoundary);

  bridge.cleanupInitialRenderHostOutput(hidden.hostOutputHandoff);
  assert.equal(container.childNodes.length, 0);
});

test("React DOM client private facade host-output update routes through private fake DOM only", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const symbol = rootBridge.privateRootPublicFacadeAdapterSymbol;
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    symbol
  );
  const document = createPrivateGateDocument(
    "public-facade-host-output-update",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const initialElement = {
    props: {
      children: "initial facade output",
      className: "facade-initial",
      id: "facade-host",
      "data-phase": "initial"
    },
    type: "main"
  };
  const nextElement = {
    props: {
      children: "updated facade output",
      className: "facade-updated",
      id: "facade-host",
      "data-phase": "updated"
    },
    type: "main"
  };
  const adapter = descriptor.value({
    hostOutputUpdateIdPrefix: "facade-conformance-update-handoff",
    nativeEnvironmentId: 843,
    nativeHandoffIdPrefix: "facade-conformance-update-native",
    publicFacadeHostOutputRenderIdPrefix: "facade-conformance-render",
    publicFacadeHostOutputUpdateIdPrefix: "facade-conformance-update",
    requestIdPrefix: "facade-conformance-request",
    rootIdPrefix: "facade-conformance-root",
    updateIdPrefix: "facade-conformance-update-id"
  });
  const root = adapter.createRoot(container);
  const initial = root.render(initialElement);
  const initialHidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(initial);
  const update = root.render(nextElement);
  const hidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputUpdatePayload(update);
  const lifecycleBoundaryPayload =
    rootBridge.getPrivateRootLifecycleRequestBoundaryPayload(
      hidden.lifecycleRequestBoundary
    );
  const rootWorkLoopRecord = initial.rootWorkLoopFinishedWorkRecord;
  const rootWorkLoopPayload =
    rootBridge.getPrivateRootPublicFacadeRootWorkLoopFinishedWorkPayload(
      rootWorkLoopRecord
    );
  const snapshot = update.sourceContainerSnapshot;
  const snapshotPayload =
    rootBridge.getPrivateRootPublicFacadeLifecycleContainerSnapshotPayload(
      snapshot
    );

  assert.equal(
    initial.rootWorkLoopFinishedWorkStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_ROOT_WORK_LOOP_FINISHED_WORK_ACCEPTED
  );
  assert.equal(
    rootWorkLoopRecord.$$typeof,
    rootBridge.privateRootPublicFacadeRootWorkLoopFinishedWorkRecordType
  );
  assert.deepEqual(rootWorkLoopRecord.childTags, [
    "HostComponent",
    "HostText"
  ]);
  assert.equal(rootWorkLoopRecord.recordsFinishedWork, true);
  assert.equal(rootWorkLoopRecord.consumedFinishedWorkRecord, true);
  assert.equal(rootWorkLoopRecord.publicRootRenderingBlocked, true);
  assert.equal(rootWorkLoopRecord.publicRootExecution, false);
  assert.equal(rootWorkLoopRecord.reconcilerExecution, false);
  assert.equal(rootWorkLoopRecord.compatibilityClaimed, false);
  assert.equal(
    rootWorkLoopRecord.metadataEvidence.status,
    rootBridge.ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS
  );
  assert.equal(rootWorkLoopPayload.renderRecord, initialHidden.renderRecord);
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeRootWorkLoopFinishedWorkRecord(
      rootWorkLoopRecord
    ),
    true
  );
  assert.deepEqual(
    initial.acceptedCapabilities.map((capability) => capability.id),
    [
      "public-facade-create-root-record",
      "public-facade-root-render-record",
      "root-marker-setup-cleanup",
      "root-listener-setup-cleanup",
      "create-render-admission",
      "fake-dom-host-output-mutation",
      "component-tree-host-instance-map",
      "latest-props-publication",
      "root-work-loop-finished-work-handoff"
    ]
  );
  assert.equal(
    update.$$typeof,
    rootBridge.privateRootPublicFacadeHostOutputUpdateRecordType
  );
  assert.equal(
    update.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(update.diagnosticId, "facade-conformance-update:1");
  assert.equal(update.updateRequestType, "root.render");
  assert.equal(update.updateUpdateId, "facade-conformance-update-id:2");
  assert.equal(
    update.lifecycleRequestAdmission,
    hidden.lifecycleRequestAdmission
  );
  assert.equal(
    update.lifecycleRequestAdmissionStatus,
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
  );
  assert.equal(update.lifecycleRequestBoundary, hidden.lifecycleRequestBoundary);
  assert.equal(
    update.lifecycleRequestBoundaryStatus,
    rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED
  );
  assert.equal(update.lifecycleRequestBoundaryAccepted, true);
  assert.equal(update.lifecycleRequestBoundarySourceOwned, true);
  assert.equal(update.lifecycleRequestBoundaryCurrent, true);
  assert.equal(
    update.updateLifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    update.hostOutputUpdateHandoffId,
    "facade-conformance-update-handoff:1"
  );
  assert.equal(
    update.nativeHandoffId,
    "facade-conformance-update-native:3"
  );
  assert.equal(
    update.nativeHandoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(update.lifecycleContainerSnapshotCurrent, true);
  assert.equal(update.hostOutputUpdateCurrent, true);
  assert.equal(update.rootCommitHostComponentUpdateCurrent, false);
  assert.equal(update.updateNativeHandoffCurrent, true);
  assert.equal(
    update.nativeRequestKind,
    rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_RENDER
  );
  assert.equal(update.nativeRequestRecord.environmentId, 843);
  assert.deepEqual(
    update.acceptedCapabilities.map((capability) => capability.id),
    [
      "public-facade-create-root-record",
      "public-facade-initial-host-output-render",
      "public-facade-root-render-update-record",
      "private-native-update-request-handoff",
      "host-output-update-handoff",
      "fake-dom-property-update",
      "property-payload-evidence",
      "fake-dom-text-update",
      "latest-props-after-mutation",
      "attribute-payload-rows"
    ]
  );
  assert.equal(update.privateFacadeRoot, true);
  assert.equal(update.publicCreateRootEnabled, false);
  assert.equal(update.publicRootExecution, false);
  assert.equal(update.publicRootCompatibilitySurface, false);
  assert.equal(update.nativeUpdateRequestMirrored, true);
  assert.equal(update.nativeExecution, false);
  assert.equal(update.reconcilerExecution, false);
  assert.equal(update.browserDomMutation, false);
  assert.equal(update.markerWrites, false);
  assert.equal(update.listenerInstallation, false);
  assert.equal(update.compatibilityClaimed, false);
  assert.equal(
    update.sourceContainerSnapshotStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_LIFECYCLE_CONTAINER_SNAPSHOT_ACCEPTED
  );
  assert.equal(update.sourceContainerSnapshotPhase, "update");
  assert.equal(update.sourceContainerSnapshotOwned, true);
  assert.equal(update.sourceContainerSnapshotBeforeChildCount, 1);
  assert.equal(update.sourceContainerSnapshotAfterChildCount, 1);
  assert.equal(update.sourceContainerSnapshotMarkerListenerPreserved, true);
  assert.equal(
    snapshot.$$typeof,
    rootBridge.privateRootPublicFacadeLifecycleContainerSnapshotRecordType
  );
  assert.equal(snapshot.phase, "update");
  assert.equal(snapshot.sourceOwned, true);
  assert.equal(snapshot.beforeTextContent, "initial facade output");
  assert.equal(snapshot.afterTextContent, "updated facade output");
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeLifecycleContainerSnapshotRecord(
      snapshot
    ),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeHostOutputUpdateRecord(update),
    true
  );
  assert.deepEqual(
    adapter.getRootRequestRecords(root).map((record) => record.requestType),
    ["createRoot", "root.render", "root.render"]
  );
  assert.deepEqual(adapter.getRootHostOutputRenderDiagnostics(root), [initial]);
  assert.deepEqual(adapter.getRootHostOutputUpdateDiagnostics(root), [update]);
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(hidden.updateRecord).element,
    nextElement
  );
  assert.equal(snapshotPayload.sourceRecord, hidden.updateRecord);
  assert.equal(snapshotPayload.container, container);
  assert.equal(snapshotPayload.before.childCount, 1);
  assert.equal(snapshotPayload.after.childCount, 1);
  assert.equal(
    rootBridge.isPrivateRootLifecycleRequestBoundaryRecord(
      hidden.lifecycleRequestBoundary
    ),
    true
  );
  assert.equal(lifecycleBoundaryPayload.sourceRecord, hidden.updateRecord);
  assert.equal(
    lifecycleBoundaryPayload.admissionRecord,
    hidden.lifecycleRequestAdmission
  );
  assert.equal(
    rootBridge.isActiveSourceOwnedPrivateRootLifecycleRequestBoundaryForAdmission(
      hidden.lifecycleRequestAdmission,
      hidden.lifecycleRequestBoundary
    ),
    true
  );
  assert.equal(
    hidden.hostOutputUpdateHandoff.updateStatus,
    rootBridge.ROOT_BRIDGE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(hidden.nativeHandoffPayload.sourceRecord, hidden.updateRecord);
  assert.equal(hidden.nativeHandoffPayload.value, nextElement);
  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild.textContent, "updated facade output");
  assert.deepEqual(attributeEntries(container.firstChild), [
    ["class", "facade-updated"],
    ["data-phase", "updated"],
    ["id", "facade-host"]
  ]);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);

  hidden.bridge.cleanupInitialRenderHostOutput(
    hidden.hostOutputRenderPayload.hostOutputHandoff
  );
  assert.equal(container.childNodes.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assertMinimalPublicCreateRootBoundary(publicBoundary);
});

test("React DOM client private facade root.render update consumes source-owned HostComponent and HostText execution metadata only", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const symbol = rootBridge.privateRootPublicFacadeAdapterSymbol;
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    symbol
  );
  const document = createPrivateGateDocument(
    "public-facade-root-render-update-execution",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const initialElement = {
    props: {
      children: "initial execution output",
      className: "execution initial",
      id: "execution-host"
    },
    type: "main"
  };
  const nextElement = {
    props: {
      children: "updated execution output",
      className: "execution updated",
      id: "execution-host",
      title: "Updated execution host"
    },
    type: "main"
  };
  const adapter = descriptor.value({
    hostOutputUpdateIdPrefix: "facade-conformance-exec-handoff",
    nativeEnvironmentId: 880,
    nativeHandoffIdPrefix: "facade-conformance-exec-native",
    publicFacadeHostOutputRenderIdPrefix: "facade-conformance-exec-render",
    publicFacadeHostOutputUpdateIdPrefix: "facade-conformance-exec-update",
    requestIdPrefix: "facade-conformance-exec-request",
    rootCommitHostComponentUpdateIdPrefix:
      "facade-conformance-exec-root-commit",
    rootIdPrefix: "facade-conformance-exec-root",
    updateIdPrefix: "facade-conformance-exec-update-id"
  });
  const root = adapter.createRoot(container);
  const initial = root.render(initialElement);
  const initialHidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(initial);
  const update = root.render(nextElement, {
    rootCommitHostComponentUpdateExecutionFactory(context) {
      return context.createRootCommitHostComponentUpdateExecutionRecord({
        mutationApplyRecords: [
          context.createRootCommitHostComponentUpdateRow(
            createRootCommitHostComponentUpdateRecordForConformance({
              recordIndex: 0,
              stateNodeRaw: 901
            })
          ),
          context.createRootCommitHostTextUpdateRow(
            createRootCommitHostTextUpdateRecordForConformance({
              recordIndex: 1,
              stateNodeRaw: 902
            })
          )
        ]
      });
    }
  });
  const hidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputUpdatePayload(update);
  const executionRecord =
    update.rootCommitHostComponentUpdateExecutionRecord;
  const executionPayload =
    rootBridge.getPrivateRootPublicFacadeRootCommitHostComponentUpdateExecutionPayload(
      executionRecord
    );

  assert.equal(
    update.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(
    executionRecord.$$typeof,
    rootBridge
      .privateRootPublicFacadeRootCommitHostComponentUpdateExecutionRecordType
  );
  assert.equal(
    executionRecord.executionStatus,
    rootBridge
      .ROOT_BRIDGE_PUBLIC_FACADE_ROOT_COMMIT_HOST_COMPONENT_UPDATE_EXECUTION_ACCEPTED
  );
  assert.equal(executionRecord.sourceUpdateId, hidden.updateRecord.updateId);
  assert.equal(executionRecord.sourceOwned, true);
  assert.equal(executionRecord.rootCommitMetadataRecordCount, 2);
  assert.equal(executionRecord.rootCommitHostComponentUpdateRecordCount, 1);
  assert.equal(executionRecord.rootCommitHostTextUpdateRecordCount, 1);
  assert.equal(executionRecord.fakeDomMutation, false);
  assert.equal(executionRecord.nativeExecution, false);
  assert.equal(executionRecord.reconcilerExecution, false);
  assert.equal(executionRecord.compatibilityClaimed, false);
  assert.equal(
    update.rootCommitHostComponentUpdateExecutionConsumed,
    true
  );
  assert.equal(
    update.rootCommitHostComponentUpdateHandoffId,
    "facade-conformance-exec-root-commit:1"
  );
  assert.equal(
    update.rootCommitHostComponentUpdateStatus,
    rootBridge.ROOT_BRIDGE_ROOT_COMMIT_HOST_COMPONENT_UPDATE_APPLIED
  );
  assert.equal(update.rootCommitHostTextUpdate.tag, "HostText");
  assert.equal(
    update.nativeHandoffId,
    "facade-conformance-exec-native:3"
  );
  assert.equal(update.nativeUpdateRequestMirrored, true);
  assert.equal(update.rootCommitUpdateExecutionBeforeNativeHandoff, true);
  assert.equal(update.lifecycleContainerSnapshotCurrent, true);
  assert.equal(update.hostOutputUpdateCurrent, true);
  assert.equal(update.rootCommitHostComponentUpdateCurrent, true);
  assert.equal(update.updateNativeHandoffCurrent, true);
  assert.equal(
    update.rustRootCommitUpdateExecutionMetadataAccepted,
    true
  );
  assert.equal(update.publicRootExecution, false);
  assert.equal(update.publicRootCompatibilitySurface, false);
  assert.equal(update.nativeExecution, false);
  assert.equal(update.reconcilerExecution, false);
  assert.equal(update.browserDomMutation, false);
  assert.equal(update.compatibilityClaimed, false);
  assert.deepEqual(
    update.acceptedCapabilities.map((capability) => capability.id),
    [
      "public-facade-create-root-record",
      "public-facade-initial-host-output-render",
      "public-facade-root-render-update-record",
      "private-native-update-request-handoff",
      "host-output-update-handoff",
      "source-owned-root-commit-host-component-update-execution",
      "root-commit-host-component-update-metadata",
      "root-commit-host-text-update-metadata",
      "fake-dom-property-update",
      "property-payload-evidence",
      "fake-dom-text-update",
      "latest-props-after-mutation",
      "attribute-payload-rows"
    ]
  );
  assert.equal(executionPayload.consumed, true);
  assert.equal(
    hidden.rootCommitHostComponentUpdatePayload.sourceRecord,
    hidden.updateRecord
  );
  assert.equal(
    hidden.rootCommitHostComponentUpdatePayload.selectedRootCommitRecord,
    executionPayload.rootCommitMetadataSelection.record
  );
  assert.equal(
    hidden.nativeHandoffPayload.sourceRecord,
    hidden.updateRecord
  );
  assert.equal(hidden.nativeHandoffPayload.value, nextElement);
  assert.equal(container.textContent, "updated execution output");
  assert.deepEqual(attributeEntries(container.firstChild), [
    ["class", "execution updated"],
    ["id", "execution-host"],
    ["title", "Updated execution host"]
  ]);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);

  assert.throws(
    () =>
      root.render(
        {
          props: {
            children: "replayed execution output",
            id: "execution-host"
          },
          type: "main"
        },
        {
          rootCommitHostComponentUpdateExecutionRecord: executionRecord
        }
      ),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE",
      message: /replayed root HostComponent update execution record/
    }
  );
  assert.deepEqual(adapter.getRootHostOutputUpdateDiagnostics(root), [
    update
  ]);
  assert.equal(container.textContent, "updated execution output");

  hidden.bridge.cleanupInitialRenderHostOutput(
    initialHidden.hostOutputHandoff
  );
  assert.equal(container.childNodes.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assertMinimalPublicCreateRootBoundary(publicBoundary);
});

test("React DOM client private facade lifecycle boundary rejects stale source records", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const symbol = rootBridge.privateRootPublicFacadeAdapterSymbol;
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    symbol
  );
  const document = createPrivateGateDocument(
    "public-facade-lifecycle-boundary",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const crossDocument = createPrivateGateDocument(
    "public-facade-lifecycle-boundary-cross",
    domContainer
  );
  const crossContainer = createPrivateGateElement(
    "DIV",
    crossDocument,
    domContainer
  );
  const initialElement = {
    props: {
      children: "boundary initial",
      id: "facade-boundary-host"
    },
    type: "section"
  };
  const nextElement = {
    props: {
      children: "boundary updated",
      id: "facade-boundary-host"
    },
    type: "section"
  };
  const adapter = descriptor.value({
    requestIdPrefix: "facade-boundary-request",
    rootIdPrefix: "facade-boundary-root",
    updateIdPrefix: "facade-boundary-update"
  });
  const root = adapter.createRoot(container);
  const initial = root.render(initialElement);
  const hidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(initial);
  const crossRoot = adapter.createRoot(crossContainer);
  const crossInitial = adapter.renderHostOutput(crossRoot, initialElement);
  const crossHidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(crossInitial);
  const clonedSnapshot = Object.freeze({
    ...initial.sourceContainerSnapshot
  });
  const clonedLifecycleRequestBoundary = Object.freeze({
    ...hidden.lifecycleRequestBoundary
  });

  assert.equal(
    rootBridge.isPrivateRootLifecycleRequestBoundaryRecord(
      hidden.lifecycleRequestBoundary
    ),
    true
  );
  assert.equal(
    rootBridge.getPrivateRootLifecycleRequestBoundaryPayload(
      hidden.lifecycleRequestBoundary
    ).sourceRecord,
    hidden.renderRecord
  );
  assert.throws(
    () =>
      adapter.updateHostOutput(root, nextElement, {
        lifecycleRequestBoundary: hidden.lifecycleRequestBoundary
      }),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE",
      message: /caller-supplied, stale, replayed, cloned, cross-root/
    }
  );
  assert.throws(
    () =>
      adapter.updateHostOutput(root, nextElement, {
        lifecycleRequestBoundary: clonedLifecycleRequestBoundary
      }),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE",
      message: /caller-supplied, stale, replayed, cloned, cross-root/
    }
  );
  assert.throws(
    () =>
      adapter.updateHostOutput(root, nextElement, {
        lifecycleRequestBoundary: crossHidden.lifecycleRequestBoundary
      }),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE",
      message: /caller-supplied, stale, replayed, cloned, cross-root/
    }
  );
  assert.throws(
    () =>
      adapter.updateHostOutput(root, nextElement, {
        sourceContainerSnapshot: initial.sourceContainerSnapshot
      }),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE",
      message: /lifecycle request-boundary evidence/
    }
  );
  assert.throws(
    () =>
      adapter.updateHostOutput(root, nextElement, {
        sourceUpdateRecord: hidden.renderRecord
      }),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE",
      message: /stale source record snapshot/
    }
  );
  assert.throws(
    () =>
      adapter.updateHostOutput(root, nextElement, {
        sourceUpdateRecord: crossHidden.renderRecord
      }),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE",
      message: /cloned or caller-built source record/
    }
  );
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeLifecycleContainerSnapshotRecord(
      clonedSnapshot
    ),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeLifecycleContainerSnapshotPayload(
      clonedSnapshot
    ),
    null
  );
  assert.deepEqual(
    adapter.getRootRequestRecords(root).map((record) => record.requestType),
    ["createRoot", "root.render"]
  );
  assert.deepEqual(adapter.getRootHostOutputUpdateDiagnostics(root), []);
  assert.equal(container.childNodes.length, 1);
  assert.equal(container.textContent, "boundary initial");
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);

  hidden.bridge.cleanupInitialRenderHostOutput(hidden.hostOutputHandoff);
  crossHidden.bridge.cleanupInitialRenderHostOutput(
    crossHidden.hostOutputHandoff
  );
  assert.equal(container.childNodes.length, 0);
  assert.equal(crossContainer.childNodes.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assertMinimalPublicCreateRootBoundary(publicBoundary);
});

test("React DOM client private facade nested host-output update stays diagnostic-only", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const componentTree = require(
    path.join(repoRoot, "packages/react-dom/src/client/component-tree.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const symbol = rootBridge.privateRootPublicFacadeAdapterSymbol;
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    symbol
  );
  const document = createPrivateGateDocument(
    "public-facade-nested-host-output-update",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const initialElement = {
    props: {
      children: {
        props: {
          children: "nested initial",
          className: "nested initial",
          id: "nested-child"
        },
        type: "span"
      },
      id: "nested-parent"
    },
    type: "section"
  };
  const nextElement = {
    props: {
      children: {
        props: {
          children: "nested updated",
          className: "nested updated",
          id: "nested-child",
          "data-phase": "updated"
        },
        type: "span"
      },
      id: "nested-parent"
    },
    type: "section"
  };
  const adapter = descriptor.value({
    hostOutputUpdateIdPrefix: "facade-conformance-nested-handoff",
    nativeEnvironmentId: 848,
    nativeHandoffIdPrefix: "facade-conformance-nested-native",
    publicFacadeNestedHostOutputUpdateIdPrefix:
      "facade-conformance-nested-update",
    requestIdPrefix: "facade-conformance-nested-request",
    rootIdPrefix: "facade-conformance-nested-root",
    updateIdPrefix: "facade-conformance-nested-update-id"
  });
  const root = adapter.createRoot(container);
  const create = adapter.getRootCreateRecord(root);
  const diagnostic = adapter.updateNestedHostOutput(
    root,
    initialElement,
    nextElement
  );
  const hidden =
    rootBridge.getPrivateRootPublicFacadeNestedHostOutputUpdatePayload(
      diagnostic
    );
  const initialLifecycleBoundaryPayload =
    rootBridge.getPrivateRootLifecycleRequestBoundaryPayload(
      hidden.initialLifecycleRequestBoundary
    );
  const updateLifecycleBoundaryPayload =
    rootBridge.getPrivateRootLifecycleRequestBoundaryPayload(
      hidden.updateLifecycleRequestBoundary
    );
  const parentNode = hidden.parentHostInstanceNode;
  const childNode = hidden.childHostInstanceNode;
  const textNode = hidden.textInstance;

  assert.equal(
    diagnostic.$$typeof,
    rootBridge.privateRootPublicFacadeNestedHostOutputUpdateRecordType
  );
  assert.equal(
    diagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_NESTED_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(diagnostic.diagnosticId, "facade-conformance-nested-update:1");
  assert.equal(diagnostic.updateRequestType, "root.render");
  assert.equal(
    diagnostic.initialLifecycleRequestAdmission,
    hidden.initialLifecycleRequestAdmission
  );
  assert.equal(
    diagnostic.initialLifecycleRequestBoundary,
    hidden.initialLifecycleRequestBoundary
  );
  assert.equal(diagnostic.initialLifecycleRequestBoundaryAccepted, true);
  assert.equal(diagnostic.initialLifecycleRequestBoundarySourceOwned, true);
  assert.equal(diagnostic.initialLifecycleRequestBoundaryCurrent, true);
  assert.equal(
    diagnostic.updateLifecycleRequestAdmission,
    hidden.updateLifecycleRequestAdmission
  );
  assert.equal(
    diagnostic.updateLifecycleRequestBoundary,
    hidden.updateLifecycleRequestBoundary
  );
  assert.equal(diagnostic.updateLifecycleRequestBoundaryAccepted, true);
  assert.equal(diagnostic.updateLifecycleRequestBoundarySourceOwned, true);
  assert.equal(diagnostic.updateLifecycleRequestBoundaryCurrent, true);
  assert.equal(
    diagnostic.hostOutputUpdateHandoffId,
    "facade-conformance-nested-handoff:1"
  );
  assert.equal(
    diagnostic.nativeHandoffId,
    "facade-conformance-nested-native:3"
  );
  assert.equal(
    diagnostic.nativeHandoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(
    diagnostic.nativeRequestKind,
    rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_RENDER
  );
  assert.equal(diagnostic.nativeRequestRecord.environmentId, 848);
  assert.deepEqual(diagnostic.nestedHostPath, [
    "HostRoot",
    "HostComponent",
    "HostComponent",
    "HostText"
  ]);
  assert.equal(diagnostic.parentHostType, "section");
  assert.equal(diagnostic.childHostType, "span");
  assert.equal(diagnostic.previousText, "nested initial");
  assert.equal(diagnostic.nextText, "nested updated");
  assert.deepEqual(diagnostic.tokenIdentity, {
    parentTokenAttachedToParentNode: true,
    childTokenAttachedToChildNode: true,
    textTokenAttachedToTextNode: true,
    parentTokenRootOwnerMatchesRoot: true,
    childTokenRootOwnerMatchesRoot: true,
    textTokenRootOwnerMatchesRoot: true,
    parentChildTokenRootOwnerMatches: true,
    childTextTokenRootOwnerMatches: true,
    parentTokenDistinctFromChildToken: true,
    childTokenDistinctFromTextToken: true
  });
  assert.equal(diagnostic.latestPropsPublished, true);
  assert.equal(
    diagnostic.latestPropsPublishOrder,
    "after-property-and-text-mutation"
  );
  assert.equal(diagnostic.parentLatestPropsPublished, true);
  assert.equal(diagnostic.childInitialLatestPropsPublished, true);
  assert.deepEqual(
    diagnostic.acceptedCapabilities.map((capability) => capability.id),
    [
      "public-facade-create-root-record",
      "public-facade-nested-host-output-render-record",
      "public-facade-root-render-update-record",
      "private-native-update-request-handoff",
      "nested-host-output-path",
      "parent-child-token-identity",
      "host-output-update-handoff",
      "fake-dom-property-update",
      "property-payload-evidence",
      "fake-dom-text-update",
      "latest-props-after-mutation",
      "attribute-payload-rows"
    ]
  );
  assert.equal(diagnostic.publicCreateRootEnabled, false);
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.publicRootCompatibilitySurface, false);
  assert.equal(diagnostic.nativeUpdateRequestMirrored, true);
  assert.equal(diagnostic.nativeExecution, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.rootScheduled, false);
  assert.equal(diagnostic.browserDomMutation, false);
  assert.equal(diagnostic.hydration, false);
  assert.equal(diagnostic.eventDispatch, false);
  assert.equal(diagnostic.refEffects, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeNestedHostOutputUpdateRecord(
      diagnostic
    ),
    true
  );
  assert.deepEqual(
    adapter.getRootRequestRecords(root).map((record) => record.requestType),
    ["createRoot", "root.render", "root.render"]
  );
  assert.deepEqual(adapter.getRootNestedHostOutputUpdateDiagnostics(root), [
    diagnostic
  ]);
  assert.deepEqual(
    rootBridge.getPrivateRootPublicFacadeRootPayload(root)
      .lifecycleRequestBoundaryRecords,
    [
      hidden.initialLifecycleRequestBoundary,
      hidden.updateLifecycleRequestBoundary
    ]
  );
  assert.equal(hidden.createRecord, create);
  assert.equal(
    initialLifecycleBoundaryPayload.sourceRecord,
    hidden.initialRenderRecord
  );
  assert.equal(updateLifecycleBoundaryPayload.sourceRecord, hidden.updateRecord);
  assert.equal(
    initialLifecycleBoundaryPayload.admissionRecord,
    hidden.initialLifecycleRequestAdmission
  );
  assert.equal(
    updateLifecycleBoundaryPayload.admissionRecord,
    hidden.updateLifecycleRequestAdmission
  );
  assert.equal(
    rootBridge.isPrivateRootLifecycleRequestBoundaryRecord(
      hidden.initialLifecycleRequestBoundary
    ),
    true
  );
  assert.equal(
    rootBridge.isActiveSourceOwnedPrivateRootLifecycleRequestBoundaryForAdmission(
      hidden.initialLifecycleRequestAdmission,
      hidden.initialLifecycleRequestBoundary
    ),
    false
  );
  assert.equal(
    rootBridge.isActiveSourceOwnedPrivateRootLifecycleRequestBoundaryForAdmission(
      hidden.updateLifecycleRequestAdmission,
      hidden.updateLifecycleRequestBoundary
    ),
    true
  );
  assert.equal(hidden.hostOutputUpdateHandoff.latestPropsPublished, true);
  assert.equal(
    rootBridge.getNativeRootBridgeHandoffPayload(hidden.nativeHandoffRecord),
    hidden.nativeHandoffPayload
  );
  assert.equal(hidden.nativeHandoffPayload.sourceRecord, hidden.updateRecord);
  assert.equal(hidden.nativeHandoffPayload.value, nextElement);
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(hidden.updateRecord).element,
    nextElement
  );
  assert.equal(
    componentTree.getRootOwnerFromHostInstanceToken(
      hidden.parentHostInstanceToken
    ),
    create.owner
  );
  assert.equal(
    componentTree.getRootOwnerFromHostInstanceToken(
      hidden.childHostInstanceToken
    ),
    create.owner
  );
  assert.notEqual(
    hidden.parentHostInstanceToken,
    hidden.childHostInstanceToken
  );
  assert.equal(container.firstChild, parentNode);
  assert.equal(parentNode.firstChild, childNode);
  assert.equal(childNode.firstChild, textNode);
  assert.equal(textNode.textContent, "nested updated");
  assert.equal(container.textContent, "nested updated");
  assert.deepEqual(attributeEntries(parentNode), [["id", "nested-parent"]]);
  assert.deepEqual(attributeEntries(childNode), [
    ["class", "nested updated"],
    ["data-phase", "updated"],
    ["id", "nested-child"]
  ]);
  assert.equal(
    componentTree.getLatestPropsFromNode(parentNode),
    initialElement.props
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(childNode),
    nextElement.props.children.props
  );
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assertMinimalPublicCreateRootBoundary(publicBoundary);
});

test("React DOM client private facade nested host-output update rejects lifecycle boundary aliases", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const symbol = rootBridge.privateRootPublicFacadeAdapterSymbol;
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    symbol
  );
  const adapter = descriptor.value({
    initialHostOutputIdPrefix: "facade-conformance-nested-alias-initial",
    publicFacadeHostOutputRenderIdPrefix:
      "facade-conformance-nested-alias-render",
    publicFacadeNestedHostOutputUpdateIdPrefix:
      "facade-conformance-nested-alias-update",
    requestIdPrefix: "facade-conformance-nested-alias-request",
    rootIdPrefix: "facade-conformance-nested-alias-root",
    updateIdPrefix: "facade-conformance-nested-alias-update-id"
  });
  const initialElement = {
    props: {
      children: {
        props: {
          children: "nested alias initial",
          id: "nested-alias-child"
        },
        type: "span"
      },
      id: "nested-alias-parent"
    },
    type: "section"
  };
  const nextElement = {
    props: {
      children: {
        props: {
          children: "nested alias updated",
          id: "nested-alias-child",
          "data-phase": "updated"
        },
        type: "span"
      },
      id: "nested-alias-parent"
    },
    type: "section"
  };
  const crossDocument = createPrivateGateDocument(
    "public-facade-nested-alias-cross",
    domContainer
  );
  const crossContainer = createPrivateGateElement(
    "DIV",
    crossDocument,
    domContainer
  );
  const crossRoot = adapter.createRoot(crossContainer);
  const crossDiagnostic = adapter.renderHostOutput(crossRoot, {
    props: {
      children: "cross alias boundary",
      id: "cross-alias-host"
    },
    type: "article"
  });
  const crossHidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      crossDiagnostic
    );
  const callerBuiltHydrateBoundary = Object.freeze({
    kind: "FastReactDomPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryRecord",
    operation: "hydrate-root-lifecycle-request-boundary"
  });

  function assertNestedAliasRejected(label, createOptions) {
    const document = createPrivateGateDocument(
      `public-facade-nested-alias-${label}`,
      domContainer
    );
    const container = createPrivateGateElement(
      "DIV",
      document,
      domContainer
    );
    const root = adapter.createRoot(container);
    const create = adapter.getRootCreateRecord(root);

    assert.throws(
      () =>
        adapter.updateNestedHostOutput(
          root,
          initialElement,
          nextElement,
          createOptions({create})
        ),
      {
        code: "FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE"
      }
    );
    assert.deepEqual(adapter.getRootRequestRecords(root), [create]);
    assert.deepEqual(adapter.getRootNestedHostOutputUpdateDiagnostics(root), []);
    assert.deepEqual(
      rootBridge.getPrivateRootPublicFacadeRootPayload(root)
        .lifecycleRequestBoundaryRecords,
      []
    );
    assert.equal(container.childNodes.length, 0);
    assert.equal(rootMarkers.getContainerRoot(container), null);
    assert.equal(listenerRegistry.hasListeningMarker(container), false);
    assert.equal(listenerRegistry.hasListeningMarker(document), false);
    assert.equal(container.__registrations.length, 0);
    assert.equal(document.__registrations.length, 0);
    assert.equal(container.__mutationLog.length, 0);
    assert.equal(document.__mutationLog.length, 0);
  }

  const rejectionCases = [
    [
      "render-callback-boundary",
      () => ({renderCallback: crossHidden.lifecycleRequestBoundary})
    ],
    [
      "source-create-record",
      ({create}) => ({sourceCreateRecord: create})
    ],
    [
      "source-render-record",
      () => ({sourceRenderRecord: crossHidden.renderRecord})
    ],
    [
      "source-boundary-alias",
      () => ({sourceBoundary: crossHidden.lifecycleRequestBoundary})
    ],
    [
      "source-container-snapshot-alias",
      () => ({
        sourceContainerSnapshot: crossDiagnostic.sourceContainerSnapshot
      })
    ],
    [
      "hydrate-boundary-shape",
      () => ({updateCallback: callerBuiltHydrateBoundary})
    ]
  ];

  for (const [label, createOptions] of rejectionCases) {
    assertNestedAliasRejected(label, createOptions);
  }

  crossHidden.bridge.cleanupInitialRenderHostOutput(
    crossHidden.hostOutputHandoff
  );
  assert.equal(crossContainer.childNodes.length, 0);
});

test("React DOM client private facade unmount cleanup stays private and non-compatible", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const symbol = rootBridge.privateRootPublicFacadeAdapterSymbol;
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    symbol
  );
  const document = createPrivateGateDocument(
    "public-facade-unmount-cleanup",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const adapter = descriptor.value({
    createRenderAdmissionIdPrefix: "facade-unmount-admission",
    initialHostOutputIdPrefix: "facade-unmount-initial",
    nativeEnvironmentId: 844,
    nativeHandoffIdPrefix: "facade-unmount-native",
    publicFacadeHostOutputUnmountCleanupIdPrefix:
      "facade-unmount-diagnostic",
    requestIdPrefix: "facade-unmount-request",
    rootIdPrefix: "facade-unmount-root",
    sideEffectIdPrefix: "facade-unmount-side-effect",
    unmountCleanupIdPrefix: "facade-unmount-cleanup",
    updateIdPrefix: "facade-unmount-update"
  });
  const root = adapter.createRoot(container);
  const diagnostic = adapter.unmountHostOutput(root, {
    props: {
      children: "facade cleanup",
      id: "facade-cleanup-host"
    },
    type: "section"
  });
  const hidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputUnmountCleanupPayload(
      diagnostic
    );
  const unmountLifecycleExecution =
    diagnostic.rootUnmountLifecycleExecutionRecord;
  const unmountLifecycleRequestBoundary =
    diagnostic.rootUnmountLifecycleRequestBoundaryRecord;
  const unmountLifecycleRequestBoundaryPayload =
    rootBridge.getPrivateRootLifecycleRequestBoundaryPayload(
      unmountLifecycleRequestBoundary
    );

  assert.equal(
    diagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT_CLEANED
  );
  assert.equal(diagnostic.diagnosticId, "facade-unmount-diagnostic:1");
  assert.equal(diagnostic.unmountCleanupId, "facade-unmount-cleanup:1");
  assert.equal(diagnostic.unmountRequestType, "root.unmount");
  assert.equal(diagnostic.unmountNoOp, false);
  assert.equal(diagnostic.unmountSync, true);
  assert.equal(diagnostic.nativeHandoffId, "facade-unmount-native:3");
  assert.equal(
    diagnostic.nativeHandoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(
    diagnostic.nativeRequestKind,
    rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_UNMOUNT
  );
  assert.equal(diagnostic.nativeRequestRecord.environmentId, 844);
  assert.equal(
    diagnostic.rootUnmountLifecycleExecutionStatus,
    rootBridge
      .ROOT_BRIDGE_PUBLIC_FACADE_ROOT_UNMOUNT_LIFECYCLE_EXECUTION_ACCEPTED
  );
  assert.equal(diagnostic.rootUnmountLifecycleExecutionConsumed, true);
  assert.equal(diagnostic.rootUnmountLifecycleExecutionSourceOwned, true);
  assert.equal(
    diagnostic.rootUnmountLifecycleRequestBoundaryStatus,
    rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED
  );
  assert.equal(
    diagnostic.rootUnmountLifecycleRequestBoundarySourceOwned,
    true
  );
  assert.equal(diagnostic.rootUnmountLifecycleRequestBoundaryCurrent, true);
  assert.equal(diagnostic.rootUnmountLifecycleSnapshotOwned, true);
  assert.equal(
    rootBridge.isPrivateRootLifecycleRequestBoundaryRecord(
      unmountLifecycleRequestBoundary
    ),
    true
  );
  assert.equal(
    unmountLifecycleExecution.rootUnmountLifecycleRequestBoundaryRecord,
    unmountLifecycleRequestBoundary
  );
  assert.equal(
    unmountLifecycleExecution.rootUnmountLifecycleRequestBoundaryStatus,
    rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED
  );
  assert.equal(
    unmountLifecycleExecution.rootUnmountLifecycleRequestBoundarySourceOwned,
    true
  );
  assert.equal(
    unmountLifecycleRequestBoundary.sourceRequestType,
    "root.unmount"
  );
  assert.equal(unmountLifecycleRequestBoundary.sourceOperation, "unmount");
  assert.equal(
    unmountLifecycleRequestBoundary.activeLifecycleStatus,
    rootBridge.ROOT_LIFECYCLE_UNMOUNTED
  );
  assert.equal(unmountLifecycleRequestBoundary.publicRootExecution, false);
  assert.equal(unmountLifecycleRequestBoundary.nativeExecution, false);
  assert.equal(unmountLifecycleRequestBoundary.reconcilerExecution, false);
  assert.equal(unmountLifecycleRequestBoundary.domMutation, false);
  assert.equal(unmountLifecycleRequestBoundary.browserDomMutation, false);
  assert.equal(unmountLifecycleRequestBoundary.hydration, false);
  assert.equal(unmountLifecycleRequestBoundary.eventDispatch, false);
  assert.equal(unmountLifecycleRequestBoundary.refEffects, false);
  assert.equal(unmountLifecycleRequestBoundary.packageCompatibility, false);
  assert.equal(unmountLifecycleRequestBoundary.compatibilityClaimed, false);
  assert.equal(
    unmountLifecycleRequestBoundaryPayload.sourceRecord,
    hidden.unmountRecord
  );
  assert.equal(
    hidden.rootUnmountLifecycleRequestBoundaryRecord,
    unmountLifecycleRequestBoundary
  );
  assert.equal(
    hidden.rootUnmountLifecycleRequestBoundaryPayload,
    unmountLifecycleRequestBoundaryPayload
  );
  assert.deepEqual(
    diagnostic.acceptedCapabilities.map((capability) => capability.id),
    [
      "public-facade-create-root-record",
      "public-facade-root-render-record",
      "public-facade-root-unmount-record",
      "private-native-unmount-request-handoff",
      "root-marker-setup-cleanup",
      "root-listener-setup-cleanup",
      "create-render-admission",
      "fake-dom-host-output-mutation",
      "fake-dom-unmount-cleanup",
      "root-unmount-admission-metadata",
      "fake-dom-container-cleanup-metadata",
      "component-tree-metadata-detach",
      "root-facade-metadata-clear",
      "latest-props-publication"
    ]
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities.map((capability) => capability.id),
    [
      "public-root-execution",
      "public-root-unmount",
      "native-execution",
      "reconciler-execution",
      "browser-dom-compatibility",
      "hydration",
      "events",
      "refs",
      "compatibility-claims"
    ]
  );
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.publicRootCompatibilitySurface, false);
  assert.equal(diagnostic.publicRootUnmounted, false);
  assert.equal(diagnostic.nativeUnmountRequestMirrored, true);
  assert.equal(diagnostic.nativeExecution, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.fakeDomMutation, true);
  assert.equal(diagnostic.browserDomMutation, false);
  assert.equal(diagnostic.rootContainerChildrenCleared, true);
  assert.equal(diagnostic.componentTreeMetadataDetached, true);
  assert.equal(
    diagnostic.rootMetadataCleanupStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_ROOT_UNMOUNT_METADATA_CLEARED
  );
  assert.equal(diagnostic.rootCreateRenderAdmissionMetadataCleared, true);
  assert.equal(diagnostic.activeHostOutputMetadataCleared, true);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.equal(diagnostic.cleanupRequired, false);
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeHostOutputUnmountCleanupRecord(
      diagnostic
    ),
    true
  );
  assert.equal(
    hidden.unmountCleanupRecord.cleanupStatus,
    rootBridge.ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_CLEANED
  );
  assert.equal(
    rootBridge.isPrivateRootUnmountHostOutputCleanupRecord(
      hidden.unmountCleanupRecord
    ),
    true
  );
  assert.equal(hidden.renderRecord.requestType, "root.render");
  assert.equal(hidden.unmountRecord.requestType, "root.unmount");
  assert.equal(hidden.nativeHandoffPayload.sourceRecord, hidden.unmountRecord);
  assert.equal(hidden.nativeHandoffPayload.value, null);
  assert.deepEqual(adapter.getRootRequestRecords(root), [
    hidden.createRecord,
    hidden.renderRecord,
    hidden.unmountRecord
  ]);
  assert.deepEqual(
    adapter.getRootHostOutputUnmountCleanupDiagnostics(root),
    [diagnostic]
  );
  assert.equal(container.childNodes.length, 0);
  assert.deepEqual(
    container.__mutationLog.map((entry) => entry.type),
    ["appendChild", "removeChild"]
  );
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assertMinimalPublicCreateRootBoundary(publicBoundary);
  assertMinimalPublicDivTextUnmountLifecycle(publicBoundary);
});

test("React DOM public root facade lifecycle rows admit only minimal fake-DOM slices", () => {
  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle
  });

  const lifecycleRows = gate.blockedPublicFacadeRows.filter((row) =>
    REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS.some(
      (expected) => expected.id === row.id
    )
  );
  assert.deepEqual(
    lifecycleRows.map((row) => row.id),
    REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS.map((row) => row.id)
  );
  assert.deepEqual(
    REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS.map(
      (row) => row.publicApi
    ),
    [
      "react-dom/client.createRoot(...).render(initial)",
      MINIMAL_PUBLIC_DIV_TEXT_RENDER_API,
      MINIMAL_PUBLIC_DIV_TEXT_UPDATE_API,
      MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL_API,
      MINIMAL_PUBLIC_DIV_TEXT_UNMOUNT_API,
      MINIMAL_PUBLIC_DIV_TEXT_RECREATE_AFTER_UNMOUNT_API
    ]
  );
  const expectedBlockedLifecycleOperations = new Map([
    ["public-create-root-render-initial", "root.render"]
  ]);
  for (const row of lifecycleRows) {
    assert.equal(row.gateStatus, REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS);
    assert.equal(row.compatibilityClaimed, false);
    if (row.id !== "public-create-root-render-initial") {
      continue;
    }
    assert.equal(row.blockedAt, expectedBlockedLifecycleOperations.get(row.id));
    assert.equal(row.listenerRegistrationCount, 0);
    assert.equal(row.mutationCount, 0);
    assert.equal(row.privateBridgeEvidence, "separate");
  }
  const publicDivTextRow = lifecycleRows.find(
    (row) => row.id === "public-create-root-render-div-text"
  );
  assert.ok(publicDivTextRow);
  assert.equal(publicDivTextRow.controlledDomShim, true);
  assert.equal(publicDivTextRow.minimalDivTextHostOutputAdmitted, true);
  assert.equal(publicDivTextRow.mutationCount, 1);
  assert.equal(publicDivTextRow.privateBridgeEvidence, "wrapped-private-facade-host-output");
  assert.equal(publicDivTextRow.renderReturnType, "undefined");
  assert.deepEqual(
    publicDivTextRow.controlledDomSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_SNAPSHOT
  );
  const publicUpdateRow = lifecycleRows.find(
    (row) => row.id === "public-create-root-render-update"
  );
  assert.ok(publicUpdateRow);
  assert.equal(publicUpdateRow.controlledDomShim, true);
  assert.equal(publicUpdateRow.minimalDivTextHostOutputUpdated, true);
  assert.equal(publicUpdateRow.hostNodeReused, true);
  assert.equal(publicUpdateRow.mutationCount, 1);
  assert.equal(
    publicUpdateRow.privateBridgeEvidence,
    "wrapped-private-facade-host-output"
  );
  assert.equal(publicUpdateRow.renderReturnType, "undefined");
  assert.deepEqual(
    publicUpdateRow.controlledDomSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_UPDATE_SNAPSHOT
  );
  const publicIdRemovalRow = lifecycleRows.find(
    (row) => row.id === "public-create-root-render-id-removal"
  );
  assert.ok(publicIdRemovalRow);
  assert.equal(publicIdRemovalRow.controlledDomShim, true);
  assert.equal(publicIdRemovalRow.minimalDivTextHostOutputIdRemoved, true);
  assert.equal(publicIdRemovalRow.hostNodeReused, true);
  assert.equal(publicIdRemovalRow.mutationCount, 1);
  assert.equal(
    publicIdRemovalRow.privateBridgeEvidence,
    "wrapped-private-facade-host-output"
  );
  assert.equal(publicIdRemovalRow.renderReturnType, "undefined");
  assert.deepEqual(
    publicIdRemovalRow.controlledDomSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL_SNAPSHOT
  );
  const publicUnmountRow = lifecycleRows.find(
    (row) => row.id === "public-create-root-unmount-call"
  );
  assert.ok(publicUnmountRow);
  assert.equal(publicUnmountRow.controlledDomShim, true);
  assert.equal(publicUnmountRow.minimalDivTextHostOutputUnmounted, true);
  assert.equal(publicUnmountRow.duplicateRootTrackingCleared, true);
  assert.equal(publicUnmountRow.mutationCount, 2);
  assert.equal(
    publicUnmountRow.privateBridgeEvidence,
    "wrapped-private-facade-host-output"
  );
  assert.equal(publicUnmountRow.renderReturnType, "undefined");
  assert.deepEqual(
    publicUnmountRow.controlledDomSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_UNMOUNT_SNAPSHOT
  );
  const publicRecreateAfterUnmountRow = lifecycleRows.find(
    (row) => row.id === "public-create-root-recreate-after-unmount"
  );
  assert.ok(publicRecreateAfterUnmountRow);
  assert.equal(publicRecreateAfterUnmountRow.controlledDomShim, true);
  assert.equal(
    publicRecreateAfterUnmountRow.minimalDivTextHostOutputRecreatedAfterUnmount,
    true
  );
  assert.equal(publicRecreateAfterUnmountRow.mutationCount, 4);
  assert.equal(
    publicRecreateAfterUnmountRow.privateBridgeEvidence,
    "wrapped-private-facade-host-output"
  );
  assert.equal(publicRecreateAfterUnmountRow.renderReturnType, "undefined");
  assert.deepEqual(
    publicRecreateAfterUnmountRow.controlledDomSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_RECREATE_UNMOUNT_SNAPSHOT
  );
  assert.equal(
    publicRecreateAfterUnmountRow.recreateAfterUnmountEvidence
      .recreatedRootDistinct,
    true
  );
  assert.equal(
    publicRecreateAfterUnmountRow.recreateAfterUnmountEvidence
      .freshRootObjectCreated,
    true
  );
  assert.equal(
    publicRecreateAfterUnmountRow.recreateAfterUnmountEvidence
      .freshCreateRootAttempt.status,
    "ok"
  );
  assert.equal(
    publicRecreateAfterUnmountRow.recreateAfterUnmountEvidence
      .staleRenderAfterUnmountAttempt.thrown.exportName,
    "createRoot().render"
  );
  assert.equal(
    publicRecreateAfterUnmountRow.recreateAfterUnmountEvidence
      .staleUnmountAfterUnmountAttempt.thrown.exportName,
    "createRoot().unmount"
  );
  assert.deepEqual(
    publicRecreateAfterUnmountRow.recreateAfterUnmountEvidence
      .initialRenderSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_SNAPSHOT
  );
  assert.deepEqual(
    publicRecreateAfterUnmountRow.recreateAfterUnmountEvidence
      .sameRootUpdateSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_REPEAT_RENDER_SNAPSHOT
  );
  assert.deepEqual(
    publicRecreateAfterUnmountRow.recreateAfterUnmountEvidence
      .firstUnmountSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_UNMOUNT_SNAPSHOT
  );
  assert.deepEqual(
    publicRecreateAfterUnmountRow.recreateAfterUnmountEvidence
      .freshRenderSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_RECREATE_RENDER_SNAPSHOT
  );
  assert.ok(
    gate.blockedPublicFacadeRows.every((row) => !row.id.startsWith("private-"))
  );

  const privateBoundary = gate.privateRootBridgeBoundary;
  assert.equal(
    privateBoundary.admissions.render.admissionStatus,
    "admitted-private-root-bridge-request-record"
  );
  assert.equal(
    privateBoundary.admissions.render.executionStatus,
    "blocked-private-root-bridge-execution"
  );
  assert.equal(
    privateBoundary.admissions.unmount.admissionStatus,
    "admitted-private-root-bridge-request-record"
  );
  assert.equal(privateBoundary.admissions.unmount.domMutation, false);
  assert.equal(privateBoundary.admissions.unmount.listenerInstallation, false);
  assert.equal(privateBoundary.admissions.unmount.compatibilityClaimed, false);
  assert.ok(
    gate.blockedPrivateBridgeRows.some(
      (row) => row.id === "private-root-render-admission"
    )
  );
  assert.ok(
    gate.blockedPrivateBridgeRows.some(
      (row) => row.id === "private-root-unmount-admission"
    )
  );
});

test("React DOM public root facade records hostile render capability rejections", () => {
  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle
  });
  const rejectionRows = gate.blockedPublicFacadeRows.filter((row) =>
    REACT_DOM_ROOT_PUBLIC_FACADE_CAPABILITY_REJECTION_ROWS.some(
      (expected) => expected.id === row.id
    )
  );

  assert.deepEqual(
    rejectionRows.map((row) => row.id),
    REACT_DOM_ROOT_PUBLIC_FACADE_CAPABILITY_REJECTION_ROWS.map((row) => row.id)
  );
  assert.deepEqual(
    new Set(rejectionRows.map((row) => row.category)),
    new Set([
      "browser-dom-expansion",
      "event-listener-prop",
      "hydration-adjacent",
      "ref-prop",
      "resource-form-controlled"
    ])
  );
  assert.deepEqual(
    rejectionRows
      .filter((row) => row.category === "event-listener-prop")
      .map((row) => row.label),
    [
      "unsupported-onClick-prop",
      "unsupported-onClickCapture-prop",
      "unsupported-onSubmit-prop",
      "unsupported-onChange-prop"
    ]
  );
  assert.deepEqual(
    rejectionRows
      .filter((row) => row.category === "ref-prop")
      .map((row) => row.label),
    ["unsupported-callback-ref-prop", "unsupported-object-ref-prop"]
  );
  const componentWrapperRows = rejectionRows.filter(
    (row) => row.blockedSurface === "component"
  );
  assert.deepEqual(
    componentWrapperRows.map((row) => row.label),
    [
      "unsupported-component",
      "unsupported-memo-component",
      "unsupported-forwardRef-component",
      "unsupported-lazy-component"
    ]
  );
  for (const row of componentWrapperRows) {
    assert.equal(row.componentRenderInvocationCount, 0);
    assert.equal(row.memoWrappedComponentInvocationCount, 0);
    assert.equal(row.forwardRefRenderInvocationCount, 0);
    assert.equal(row.forwardRefRefMutationCount, 0);
    assert.equal(row.lazyLoaderInvocationCount, 0);
    assert.equal(row.lazyLoaderErrorThrown, false);
  }
  assert.ok(
    rejectionRows.some(
      (row) =>
        row.label === "unsupported-suppressHydrationWarning-prop" &&
        row.blockedSurface === "hydration"
    )
  );
  assert.ok(
    rejectionRows.some(
      (row) =>
        row.label === "unsupported-hydrateRoot-options-callbacks" &&
        row.hydrateRootCallbackInvocationCount === 0 &&
        row.postAcceptedRenderRejected === false
    )
  );
  for (const row of rejectionRows) {
    assert.equal(row.gateStatus, REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS);
    assert.equal(row.compatibilityClaimed, false);
    assert.equal(row.freshRootRejected, true);
    assert.equal(row.rejectedBeforePrivateBridgeRender, true);
    assert.equal(row.rejectedBeforeNativeExecution, true);
    assert.equal(row.listenerMarkerWritten, false);
    assert.equal(row.callbackInvocationCount, 0);
    assert.equal(row.refCallbackInvocationCount, 0);
    assert.equal(row.refObjectMutationCount, 0);
    assert.equal(row.resourceDomInsertion, false);
    assert.equal(row.formActionInvocationCount, 0);
    assert.equal(row.controlledInputRestore, false);
    if (row.postAcceptedRenderRejected) {
      assert.equal(row.previousFakeDomNodePreserved, true);
      assert.equal(row.previousInnerHTMLPreserved, true);
      assert.equal(row.previousGetAttributeIdPreserved, true);
      assert.equal(row.previousLatestPropsPreserved, true);
      assert.equal(row.previousMutationLogPreserved, true);
    }
  }
});

test("React DOM public root facade gate records minimal public createRoot without compatibility", () => {
  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assertMinimalPublicCreateRootBoundary(publicBoundary);

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    localPublicFacadeBoundary: publicBoundary,
    privateRootBridgeBoundary: inspectReactDomPrivateRootBridgeBoundary()
  });

  assert.equal(gate.ok, true);
  const createRootRow = gate.blockedPublicFacadeRows.find(
    (row) => row.id === "public-create-root"
  );
  assert.equal(createRootRow.minimalPublicRootObjectExposed, true);
  assert.equal(createRootRow.compatibilityClaimed, false);
  assert.equal(gate.summary.compatibilityAdmitted, false);
  assert.equal(gate.summary.compatibilityClaimed, false);

  const broadPublicBoundary = clone(publicBoundary);
  broadPublicBoundary.createRoot.sideEffects.listenerRegistrationCount = 1;
  const broadGate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    localPublicFacadeBoundary: broadPublicBoundary,
    privateRootBridgeBoundary: inspectReactDomPrivateRootBridgeBoundary()
  });
  assert.equal(broadGate.ok, false);
  assert.ok(
    broadGate.failures.some(
      (failure) =>
        failure.gateStatus === "public-root-export-not-placeholder-blocked" &&
        failure.exportName === "createRoot"
    )
  );
});

test("React DOM public root facade gate records minimal public div text render", () => {
  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assertMinimalPublicDivTextLifecycle(publicBoundary);

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    localPublicFacadeBoundary: publicBoundary,
    privateRootBridgeBoundary: inspectReactDomPrivateRootBridgeBoundary()
  });

  assert.equal(gate.ok, true);
  const renderDivTextRow = gate.blockedPublicFacadeRows.find(
    (row) => row.id === "public-create-root-render-div-text"
  );
  assert.equal(renderDivTextRow.minimalDivTextHostOutputAdmitted, true);
  assert.equal(renderDivTextRow.compatibilityClaimed, false);
  assert.equal(renderDivTextRow.mutationCount, 1);
  assert.deepEqual(
    renderDivTextRow.controlledDomSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_SNAPSHOT
  );

  const broadPublicBoundary = clone(publicBoundary);
  broadPublicBoundary.publicRootLifecycle.renderDivText.controlledDomSnapshot = {
    ...broadPublicBoundary.publicRootLifecycle.renderDivText
      .controlledDomSnapshot,
    containerChildCount: 2,
    containerChildNodeNames: ["DIV", "SPAN"],
    containerMutationLog: [
      ["appendChild", "DIV"],
      ["appendChild", "SPAN"]
    ]
  };
  broadPublicBoundary.publicRootLifecycle.renderDivText.sideEffects.mutationCount = 2;
  const broadGate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    localPublicFacadeBoundary: broadPublicBoundary,
    privateRootBridgeBoundary: inspectReactDomPrivateRootBridgeBoundary()
  });
  assert.equal(broadGate.ok, false);
  assert.ok(
    broadGate.failures.some(
      (failure) =>
        failure.gateStatus ===
          "public-root-lifecycle-operation-produced-side-effects" &&
        failure.id === "public-create-root-render-div-text"
    )
  );

  const falseGreenCases = [
    {
      label: "omits children count",
      mutate(operation) {
        delete operation.controlledDomSnapshot.containerChildrenCount;
      }
    },
    {
      label: "omits first element child node",
      mutate(operation) {
        delete operation.controlledDomSnapshot
          .containerFirstElementChildNodeName;
      }
    },
    {
      label: "omits container innerHTML",
      mutate(operation) {
        delete operation.controlledDomSnapshot.containerInnerHTML;
      }
    },
    {
      label: "omits first element child tagName",
      mutate(operation) {
        delete operation.controlledDomSnapshot
          .containerFirstElementChildTagName;
      }
    },
    {
      label: "uses unescaped serialized attribute and text",
      mutate(operation) {
        operation.controlledDomSnapshot.containerInnerHTML =
          `<div id="${MINIMAL_PUBLIC_DIV_TEXT_ID}">${MINIMAL_PUBLIC_DIV_TEXT}</div>`;
      }
    },
    {
      label: "uses unescaped child innerHTML text",
      mutate(operation) {
        operation.controlledDomSnapshot.containerFirstElementChildInnerHTML =
          MINIMAL_PUBLIC_DIV_TEXT;
      }
    },
    {
      label: "serializes raw getAttribute id",
      mutate(operation) {
        operation.controlledDomSnapshot.containerFirstElementChildGetAttributeId =
          MINIMAL_PUBLIC_DIV_TEXT_ID_ESCAPED;
      }
    },
    {
      label: "serializes stored props id",
      mutate(operation) {
        operation.controlledDomSnapshot.containerFirstElementChildStoredPropsId =
          MINIMAL_PUBLIC_DIV_TEXT_ID_ESCAPED;
      }
    },
    {
      label: "drops stored props identity",
      mutate(operation) {
        operation.controlledDomSnapshot
          .containerFirstElementChildStoredPropsSameObject = false;
      }
    },
    {
      label: "omits mutation log",
      mutate(operation) {
        delete operation.controlledDomSnapshot.containerMutationLog;
      }
    },
    {
      label: "adds listener side effect",
      mutate(operation) {
        operation.sideEffects.listenerRegistrationCount = 1;
      }
    }
  ];
  for (const falseGreenCase of falseGreenCases) {
    const tamperedBoundary = clone(publicBoundary);
    falseGreenCase.mutate(
      tamperedBoundary.publicRootLifecycle.renderDivText
    );
    const tamperedGate = evaluateReactDomRootPublicFacadeBlockedGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle,
      clientRootOracle,
      localPublicFacadeBoundary: tamperedBoundary,
      privateRootBridgeBoundary: inspectReactDomPrivateRootBridgeBoundary()
    });
    assert.equal(tamperedGate.ok, false, falseGreenCase.label);
    assert.ok(
      tamperedGate.failures.some(
        (failure) => failure.id === "public-create-root-render-div-text"
      ),
      falseGreenCase.label
    );
  }

  const updateFalseGreenCases = [
    {
      expectedId: "public-create-root-render-update",
      label: "uses stale initial id attributes after update",
      operationKey: "renderUpdate",
      mutate(operation) {
        operation.controlledDomSnapshot.containerFirstElementChildAttributes = [
          ["id", MINIMAL_PUBLIC_DIV_TEXT_ID]
        ];
        operation.controlledDomSnapshot.containerInnerHTML =
          `<div id="${MINIMAL_PUBLIC_DIV_TEXT_ID_ESCAPED}">${MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ESCAPED}</div>`;
      }
    },
    {
      expectedId: "public-create-root-render-update",
      label: "omits updated attr fields",
      operationKey: "renderUpdate",
      mutate(operation) {
        delete operation.controlledDomSnapshot
          .containerFirstElementChildAttributes;
      }
    },
    {
      expectedId: "public-create-root-render-update",
      label: "serializes updated getAttribute id",
      operationKey: "renderUpdate",
      mutate(operation) {
        operation.controlledDomSnapshot.containerFirstElementChildGetAttributeId =
          MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID_ESCAPED;
      }
    },
    {
      expectedId: "public-create-root-render-update",
      label: "keeps stale stored props id after update",
      operationKey: "renderUpdate",
      mutate(operation) {
        operation.controlledDomSnapshot.containerFirstElementChildStoredPropsId =
          MINIMAL_PUBLIC_DIV_TEXT_ID;
      }
    },
    {
      expectedId: "public-create-root-render-update",
      label: "drops updated stored props identity",
      operationKey: "renderUpdate",
      mutate(operation) {
        operation.controlledDomSnapshot
          .containerFirstElementChildStoredPropsSameObject = false;
      }
    },
    {
      expectedId: "public-create-root-render-update",
      label: "claims update compatibility",
      operationKey: "renderUpdate",
      mutate(operation) {
        operation.compatibilityClaimed = true;
      }
    },
    {
      expectedId: "public-create-root-render-id-removal",
      label: "keeps stale id after removal",
      operationKey: "renderIdRemoval",
      mutate(operation) {
        operation.controlledDomSnapshot.containerFirstElementChildAttributes = [
          ["id", MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID]
        ];
        operation.controlledDomSnapshot.containerInnerHTML =
          `<div id="${MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID_ESCAPED}">${MINIMAL_PUBLIC_DIV_TEXT_ID_REMOVAL_ESCAPED}</div>`;
      }
    },
    {
      expectedId: "public-create-root-render-id-removal",
      label: "retains raw getAttribute id after removal",
      operationKey: "renderIdRemoval",
      mutate(operation) {
        operation.controlledDomSnapshot.containerFirstElementChildGetAttributeId =
          MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID;
      }
    },
    {
      expectedId: "public-create-root-render-id-removal",
      label: "retains stored props id after removal",
      operationKey: "renderIdRemoval",
      mutate(operation) {
        operation.controlledDomSnapshot
          .containerFirstElementChildStoredPropsHasId = true;
        operation.controlledDomSnapshot.containerFirstElementChildStoredPropsId =
          MINIMAL_PUBLIC_DIV_TEXT_UPDATE_ID;
      }
    },
    {
      expectedId: "public-create-root-render-id-removal",
      label: "omits removed attr fields",
      operationKey: "renderIdRemoval",
      mutate(operation) {
        delete operation.controlledDomSnapshot
          .containerFirstElementChildAttributes;
      }
    }
  ];
  for (const falseGreenCase of updateFalseGreenCases) {
    const tamperedBoundary = clone(publicBoundary);
    falseGreenCase.mutate(
      tamperedBoundary.publicRootLifecycle[falseGreenCase.operationKey]
    );
    const tamperedGate = evaluateReactDomRootPublicFacadeBlockedGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle,
      clientRootOracle,
      localPublicFacadeBoundary: tamperedBoundary,
      privateRootBridgeBoundary: inspectReactDomPrivateRootBridgeBoundary()
    });
    assert.equal(tamperedGate.ok, false, falseGreenCase.label);
    assert.ok(
      tamperedGate.failures.some(
        (failure) => failure.id === falseGreenCase.expectedId
      ),
      falseGreenCase.label
    );
  }

  const staleLifecycleRows = clone(
    REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS
  );
  staleLifecycleRows[1].publicApi = SIMPLE_PUBLIC_DIV_TEXT_API;
  const staleLifecycleRowGate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    localPublicFacadeBoundary: publicBoundary,
    privateRootBridgeBoundary: inspectReactDomPrivateRootBridgeBoundary(),
    publicFacadeLifecycleRows: staleLifecycleRows
  });
  assert.equal(staleLifecycleRowGate.ok, false);
  assert.equal(
    staleLifecycleRowGate.blockedPublicFacadeRows.some(
      (row) => row.id === "public-create-root-render-div-text"
    ),
    false
  );
  assert.ok(
    staleLifecycleRowGate.failures.some(
      (failure) =>
        failure.gateStatus ===
          "public-root-lifecycle-row-public-api-label-mismatch" &&
        failure.id === "public-create-root-render-div-text" &&
        failure.publicApi === SIMPLE_PUBLIC_DIV_TEXT_API &&
        failure.expectedPublicApi === MINIMAL_PUBLIC_DIV_TEXT_RENDER_API
    )
  );
});

test("React DOM public root facade gate records recreate after unmount without compatibility", () => {
  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assertMinimalPublicDivTextRecreateAfterUnmountLifecycle(publicBoundary);

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    localPublicFacadeBoundary: publicBoundary,
    privateRootBridgeBoundary: inspectReactDomPrivateRootBridgeBoundary()
  });

  assert.equal(gate.ok, true);
  const recreateAfterUnmountRow = gate.blockedPublicFacadeRows.find(
    (row) => row.id === "public-create-root-recreate-after-unmount"
  );
  assert.equal(
    recreateAfterUnmountRow.minimalDivTextHostOutputRecreatedAfterUnmount,
    true
  );
  assert.equal(recreateAfterUnmountRow.compatibilityClaimed, false);
  assert.equal(recreateAfterUnmountRow.mutationCount, 4);
  assert.deepEqual(
    recreateAfterUnmountRow.controlledDomSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_RECREATE_UNMOUNT_SNAPSHOT
  );
  assert.deepEqual(
    recreateAfterUnmountRow.recreateAfterUnmountEvidence.freshRenderSnapshot,
    MINIMAL_PUBLIC_DIV_TEXT_RECREATE_RENDER_SNAPSHOT
  );
  assert.equal(
    recreateAfterUnmountRow.recreateAfterUnmountEvidence
      .staleRenderAfterUnmountAttempt.thrown.code,
    "FAST_REACT_UNIMPLEMENTED"
  );
  assert.equal(
    recreateAfterUnmountRow.recreateAfterUnmountEvidence
      .staleUnmountAfterUnmountAttempt.thrown.code,
    "FAST_REACT_UNIMPLEMENTED"
  );
  assert.equal(gate.summary.compatibilityAdmitted, false);
  assert.equal(gate.summary.compatibilityClaimed, false);

  const falseGreenCases = [
    {
      label: "reuses old root object",
      mutate(operation) {
        operation.recreatedRootDistinct = false;
      }
    },
    {
      label: "old render does not fail closed",
      mutate(operation) {
        operation.staleRenderAfterUnmountAttempt = {
          label: "stale root.render after root.unmount",
          status: "ok",
          value: {
            type: "undefined"
          }
        };
      }
    },
    {
      label: "old unmount uses no-op lane",
      mutate(operation) {
        operation.staleUnmountAfterUnmountAttempt = {
          label: "stale root.unmount after root.unmount",
          status: "ok",
          value: {
            type: "undefined"
          }
        };
      }
    },
    {
      label: "fresh render did not run",
      mutate(operation) {
        operation.freshRenderAttempt = {
          label: "fresh root.render after recreate",
          status: "throws",
          thrown: {
            code: "FAST_REACT_UNIMPLEMENTED",
            entrypoint: "react-dom/client",
            exportName: "createRoot().render"
          }
        };
      }
    },
    {
      label: "fresh render omits raw getAttribute",
      mutate(operation) {
        delete operation.recreateSnapshots.freshRender
          .containerFirstElementChildGetAttributeId;
      }
    },
    {
      label: "fresh render serializes unescaped hostile text",
      mutate(operation) {
        operation.recreateSnapshots.freshRender.containerInnerHTML =
          `<div id="${MINIMAL_PUBLIC_DIV_TEXT_ID}">${MINIMAL_PUBLIC_DIV_TEXT}</div>`;
      }
    },
    {
      label: "fresh unmount mutation log incomplete",
      mutate(operation) {
        operation.controlledDomSnapshot.containerMutationLog = [
          ["appendChild", "DIV"],
          ["removeChild", "DIV"],
          ["appendChild", "DIV"]
        ];
        operation.sideEffects.mutationCount = 3;
      }
    }
  ];
  for (const falseGreenCase of falseGreenCases) {
    const tamperedBoundary = clone(publicBoundary);
    falseGreenCase.mutate(
      tamperedBoundary.publicRootLifecycle.recreateAfterUnmount
    );
    const tamperedGate = evaluateReactDomRootPublicFacadeBlockedGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle,
      clientRootOracle,
      localPublicFacadeBoundary: tamperedBoundary,
      privateRootBridgeBoundary: inspectReactDomPrivateRootBridgeBoundary()
    });
    assert.equal(tamperedGate.ok, false, falseGreenCase.label);
    assert.ok(
      tamperedGate.failures.some(
        (failure) =>
          failure.id === "public-create-root-recreate-after-unmount"
      ),
      falseGreenCase.label
    );
  }

  const staleLifecycleRows = clone(
    REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS
  );
  staleLifecycleRows[5].publicApi = MINIMAL_PUBLIC_DIV_TEXT_UNMOUNT_API;
  const staleLifecycleRowGate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    localPublicFacadeBoundary: publicBoundary,
    privateRootBridgeBoundary: inspectReactDomPrivateRootBridgeBoundary(),
    publicFacadeLifecycleRows: staleLifecycleRows
  });
  assert.equal(staleLifecycleRowGate.ok, false);
  assert.ok(
    staleLifecycleRowGate.failures.some(
      (failure) =>
        failure.gateStatus ===
          "public-root-lifecycle-row-public-api-label-mismatch" &&
        failure.id === "public-create-root-recreate-after-unmount" &&
        failure.publicApi === MINIMAL_PUBLIC_DIV_TEXT_UNMOUNT_API &&
        failure.expectedPublicApi ===
          MINIMAL_PUBLIC_DIV_TEXT_RECREATE_AFTER_UNMOUNT_API
    )
  );
});

test("React DOM public root facade gate rejects premature public hydrateRoot behavior", () => {
  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  const prematurePublicBoundary = clone(publicBoundary);
  prematurePublicBoundary.hydrateRoot = {
    ...prematurePublicBoundary.hydrateRoot,
    status: "ok",
    value: {
      keys: ["render", "unmount"],
      type: "object"
    },
    rootObjectCreated: true
  };

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    localPublicFacadeBoundary: prematurePublicBoundary,
    privateRootBridgeBoundary: inspectReactDomPrivateRootBridgeBoundary()
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus === "public-root-export-not-placeholder-blocked" &&
        failure.exportName === "hydrateRoot"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus === "public-hydration-not-placeholder-blocked"
    )
  );
});

test("React DOM public root facade gate rejects private host-output promotion to public compatibility", () => {
  const rootRenderGate = clone(
    evaluateReactDomRootRenderE2EConformanceGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle
    })
  );
  rootRenderGate.summary.privateHostOutputCompatibilityClaimed = true;
  rootRenderGate.privateHostOutputGate.compatibilityClaimed = true;
  rootRenderGate.privateHostOutputDiagnosticScenarioModeRows[0] = {
    ...rootRenderGate.privateHostOutputDiagnosticScenarioModeRows[0],
    comparedToReactDomOracle: true,
    compatibilityClaimed: true,
    publicRootCompatibilitySurface: true
  };

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    rootRenderGateResult: rootRenderGate
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-host-output-claims-compatibility-while-public-facade-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-host-output-row-not-private-blocked"
    )
  );
});

test("React DOM public root facade gate rejects private warning-boundary promotion to public compatibility", () => {
  const rootRenderGate = clone(
    evaluateReactDomRootRenderE2EConformanceGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle
    })
  );
  rootRenderGate.summary.privateWarningBoundaryCompatibilityClaimed = true;
  rootRenderGate.summary.privateWarningBoundaryConsoleOutputUsedAsEvidence = true;
  rootRenderGate.privateWarningBoundaryGate.compatibilityClaimed = true;
  rootRenderGate.privateWarningBoundaryGate.consoleOutputUsedAsEvidence = true;
  rootRenderGate.privateWarningBoundaryDiagnosticScenarioModeRows[0] = {
    ...rootRenderGate.privateWarningBoundaryDiagnosticScenarioModeRows[0],
    comparedToReactDomOracle: true,
    compatibilityClaimed: true,
    consoleOutputUsedAsEvidence: true,
    publicRootCompatibilitySurface: true
  };

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    rootRenderGateResult: rootRenderGate
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-warning-boundary-claims-compatibility-while-public-facade-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-warning-boundary-row-not-private"
    )
  );
});

test("React DOM public root facade gate rejects private cross-root scheduling promotion to public flushSync compatibility", () => {
  const rootRenderGate = clone(
    evaluateReactDomRootRenderE2EConformanceGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle
    })
  );
  rootRenderGate.summary.privateCrossRootSchedulingCompatibilityClaimed = true;
  rootRenderGate.summary
    .privateCrossRootSchedulingPublicFlushSyncCompatibilityClaimed = true;
  rootRenderGate.privateCrossRootSchedulingGate.compatibilityClaimed = true;
  rootRenderGate.privateCrossRootSchedulingGate.publicFlushSyncCompatibilityClaimed =
    true;
  rootRenderGate.privateCrossRootSchedulingDiagnosticScenarioModeRows[0] = {
    ...rootRenderGate.privateCrossRootSchedulingDiagnosticScenarioModeRows[0],
    comparedToReactDomOracle: true,
    compatibilityClaimed: true,
    publicFlushSyncCompatibilityClaimed: true,
    publicRootCompatibilitySurface: true
  };

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    rootRenderGateResult: rootRenderGate
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-cross-root-scheduling-claims-compatibility-while-public-facade-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-cross-root-scheduling-row-not-private"
    )
  );
});

test("React DOM public root facade gate rejects private act/passive promotion to public compatibility", () => {
  const rootRenderGate = clone(
    evaluateReactDomRootRenderE2EConformanceGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle
    })
  );
  rootRenderGate.summary.privateActPassiveCompatibilityClaimed = true;
  rootRenderGate.summary.privateActPassivePublicReactActCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateActPassivePublicReactDomTestUtilsActCompatibilityClaimed = true;
  rootRenderGate.summary.privateActPassivePublicRootRenderCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateActPassivePublicPassiveEffectCompatibilityClaimed = true;
  rootRenderGate.privateActPassiveGate.compatibilityClaimed = true;
  rootRenderGate.privateActPassiveGate.publicReactActCompatibilityClaimed = true;
  rootRenderGate.privateActPassiveGate
    .publicReactDomTestUtilsActCompatibilityClaimed = true;
  rootRenderGate.privateActPassiveGate.publicRootRenderCompatibilityClaimed =
    true;
  rootRenderGate.privateActPassiveGate
    .publicPassiveEffectCompatibilityClaimed = true;
  rootRenderGate.privateActPassiveDiagnosticScenarioModeRows[0] = {
    ...rootRenderGate.privateActPassiveDiagnosticScenarioModeRows[0],
    comparedToReactDomOracle: true,
    compatibilityClaimed: true,
    publicReactActCompatibilityClaimed: true,
    publicReactDomTestUtilsActCompatibilityClaimed: true,
    publicRootCompatibilitySurface: true,
    publicRootRenderCompatibilityClaimed: true,
    publicPassiveEffectCompatibilityClaimed: true
  };

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    rootRenderGateResult: rootRenderGate
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-act-passive-claims-compatibility-while-public-facade-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus === "root-render-private-act-passive-row-not-private"
    )
  );
});

test("React DOM public root facade gate rejects private root work-loop commit handoff promotion", () => {
  const rootRenderGate = clone(
    evaluateReactDomRootRenderE2EConformanceGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle
    })
  );
  rootRenderGate.summary.privateRootWorkLoopCommitHandoffCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicRootCompatibilitySurface = true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicCreateRootCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicRootRenderCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicRootUpdateCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicRootUnmountCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicHydrateRootCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicHydrationCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicDomMutationCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicTestRendererCompatibilityClaimed =
    true;
  rootRenderGate.privateRootWorkLoopCommitHandoffGate.compatibilityClaimed =
    true;
  rootRenderGate.privateRootWorkLoopCommitHandoffGate
    .publicHydrateRootCompatibilityClaimed = true;
  rootRenderGate.privateRootWorkLoopCommitHandoffDiagnosticRows[0] = {
    ...rootRenderGate.privateRootWorkLoopCommitHandoffDiagnosticRows[0],
    compatibilityClaimed: true,
    comparedToReactDomOracle: true,
    privateEvidenceOnly: false,
    publicCompatibilityClaims: {
      ...rootRenderGate.privateRootWorkLoopCommitHandoffDiagnosticRows[0]
        .publicCompatibilityClaims,
      publicRootCompatibilitySurface: true,
      publicHydrateRootCompatibilityClaimed: true
    },
    publicRootCompatibilitySurface: true,
    publicHydrateRootCompatibilityClaimed: true
  };

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    rootRenderGateResult: rootRenderGate
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-root-work-loop-commit-handoff-claims-compatibility-while-public-facade-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-root-work-loop-commit-handoff-gate-public-claim-leaked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-root-work-loop-commit-handoff-row-not-private"
    )
  );
});

test("React DOM public root facade gate rejects private React DOM metadata promotion to public compatibility", () => {
  const rootRenderGate = clone(
    evaluateReactDomRootRenderE2EConformanceGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle
    })
  );
  rootRenderGate.summary.privateReactDomMetadataCompatibilityClaimed = true;
  rootRenderGate.summary
    .privateReactDomMetadataPublicRootRenderCompatibilityClaimed = true;
  rootRenderGate.summary
    .privateReactDomMetadataPublicHydrationCompatibilityClaimed = true;
  rootRenderGate.summary
    .privateReactDomMetadataPublicEventCompatibilityClaimed = true;
  rootRenderGate.summary
    .privateReactDomMetadataPublicResourceCompatibilityClaimed = true;
  rootRenderGate.summary
    .privateReactDomMetadataPublicFormCompatibilityClaimed = true;
  rootRenderGate.summary
    .privateReactDomMetadataPublicControlledInputCompatibilityClaimed = true;
  rootRenderGate.privateReactDomMetadataGate.compatibilityClaimed = true;
  rootRenderGate.privateReactDomMetadataGate
    .publicRootRenderCompatibilityClaimed = true;
  rootRenderGate.privateReactDomMetadataGate
    .publicHydrationCompatibilityClaimed = true;
  rootRenderGate.privateReactDomMetadataGate
    .publicEventCompatibilityClaimed = true;
  rootRenderGate.privateReactDomMetadataGate
    .publicResourceCompatibilityClaimed = true;
  rootRenderGate.privateReactDomMetadataGate
    .publicFormCompatibilityClaimed = true;
  rootRenderGate.privateReactDomMetadataGate
    .publicControlledInputCompatibilityClaimed = true;
  rootRenderGate.privateReactDomMetadataDiagnosticRows[0] = {
    ...rootRenderGate.privateReactDomMetadataDiagnosticRows[0],
    comparedToReactDomOracle: true,
    compatibilityClaimed: true,
    publicControlledInputCompatibilityClaimed: true,
    publicEventCompatibilityClaimed: true,
    publicFormCompatibilityClaimed: true,
    publicHydrationCompatibilityClaimed: true,
    publicResourceCompatibilityClaimed: true,
    publicRootCompatibilitySurface: true,
    publicRootRenderCompatibilityClaimed: true
  };

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    rootRenderGateResult: rootRenderGate
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-react-dom-metadata-claims-compatibility-while-public-facade-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-react-dom-metadata-row-not-private"
    )
  );
});

test("React DOM public root facade remains blocked with hydration resource/form metadata ids", () => {
  const hydrationGate = require(
    path.join(
      repoRoot,
      "packages/react-dom/src/client/hydration-boundary-gate.js"
    )
  );
  const resourceFormGate = require(
    path.join(repoRoot, "packages/react-dom/src/resource-form-gates.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const document = createPrivateGateDocument(
    "public-facade-hydration-metadata",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  container.childNodes = [
    { data: "$", nodeType: domContainer.COMMENT_NODE },
    { data: "/$", nodeType: domContainer.COMMENT_NODE }
  ];

  const record = hydrationGate
    .createHydrationBoundaryGate({
      recordIdPrefix: "public-facade-hydration-metadata"
    })
    .recordUnsupportedHydrateRoot(
      container,
      { props: { children: "metadata ids" }, type: "App" },
      { identifierPrefix: "public-facade-hydration-metadata-" }
    );
  const metadata = record.acceptedPrivateMetadataDiagnostics;

  assert.equal(
    metadata.kind,
    hydrationGate.HYDRATION_BOUNDARY_ACCEPTED_METADATA_DIAGNOSTIC_KIND
  );
  assert.equal(
    metadata.gateId,
    hydrationGate.privateHydrationBoundaryAcceptedMetadataGateId
  );
  assert.deepEqual(metadata.metadataIds, [
    "hydration-replay-ownership",
    hydrationGate
      .privateHydrationTextMismatchRecoverableErrorRoutingMetadataId,
    hydrationGate
      .privateHydrationRecoverableErrorBoundaryAdmissionMetadataId,
    "resource-map-commit",
    "stylesheet-load-error-state",
    "form-action-event-extraction",
    "form-reset-queue-commit"
  ]);
  assert.deepEqual(metadata.gateIds, [
    hydrationGate.privateHydrationReplayOwnershipGateId,
    hydrationGate
      .privateHydrationTextMismatchRecoverableErrorRoutingExecutionGateId,
    hydrationGate.privateHydrationRecoverableErrorBoundaryAdmissionGateId,
    resourceFormGate.privateResourceHintResourceMapCommitGateId,
    resourceFormGate.privateResourceHintStylesheetLoadErrorStateGateId,
    resourceFormGate.privateFormActionEventExtractionGateId,
    resourceFormGate.privateFormActionResetQueueCommitGateId
  ]);
  assert.equal(metadata.compatibilityClaimed, false);
  assert.equal(metadata.publicRootRenderCompatibilityClaimed, false);
  assert.equal(metadata.publicHydrationCompatibilityClaimed, false);
  assert.equal(metadata.publicHydrationReplayCompatibilityClaimed, false);
  assert.equal(metadata.publicResourceCompatibilityClaimed, false);
  assert.equal(metadata.publicResourceDomInsertionCompatibilityClaimed, false);
  assert.equal(metadata.publicStylesheetCompatibilityClaimed, false);
  assert.equal(metadata.publicFormCompatibilityClaimed, false);
  assert.equal(metadata.publicFormActionCompatibilityClaimed, false);
  assert.equal(metadata.publicFormResetCompatibilityClaimed, false);
  assert.equal(metadata.hydrationReplaySupported, false);
  assert.equal(metadata.eventsReplayed, false);
  assert.equal(metadata.resourceDomInsertion, false);
  assert.equal(metadata.resourceMapsCreated, false);
  assert.equal(metadata.stylesheetLoadListenersInstalled, false);
  assert.equal(metadata.stylesheetCommitSuspended, false);
  assert.equal(metadata.formActionEventPluginInvoked, false);
  assert.equal(metadata.actionInvoked, false);
  assert.equal(metadata.resetUpdateEnqueued, false);
  assert.equal(metadata.formResetCommitted, false);
  assert.equal(record.canHydrate, false);
  assert.equal(record.publicRootCreated, false);
  assert.equal(record.eventsReplayed, false);
  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle
  });

  assert.equal(gate.ok, true);
  assert.equal(gate.summary.compatibilityClaimed, false);
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicHydrationCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicResourceCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicFormCompatibilityClaimed,
    false
  );
});

test("React DOM public root facade gate rejects accepted 503-533 private diagnostic promotion", () => {
  const rootRenderGate = clone(
    evaluateReactDomRootRenderE2EConformanceGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle
    })
  );
  rootRenderGate.summary.privatePromotion503533CompatibilityClaimed = true;
  rootRenderGate.summary
    .privatePromotion503533PublicRootCompatibilitySurface = true;
  rootRenderGate.summary
    .privatePromotion503533PublicRenderCompatibilityClaimed = true;
  rootRenderGate.summary
    .privatePromotion503533PublicRootRenderCompatibilityClaimed = true;
  rootRenderGate.summary
    .privatePromotion503533PublicHydrationCompatibilityClaimed = true;
  rootRenderGate.summary
    .privatePromotion503533PublicEventCompatibilityClaimed = true;
  rootRenderGate.summary
    .privatePromotion503533PublicResourceCompatibilityClaimed = true;
  rootRenderGate.summary
    .privatePromotion503533PublicFormCompatibilityClaimed = true;
  rootRenderGate.summary
    .privatePromotion503533PublicControlledInputCompatibilityClaimed = true;
  rootRenderGate.summary
    .privatePromotion503533PublicTestRendererCompatibilityClaimed = true;
  rootRenderGate.privatePromotion503533Gate.compatibilityClaimed = true;
  rootRenderGate.privatePromotion503533Gate.publicTestRendererCompatibilityClaimed =
    true;
  rootRenderGate.privatePromotionRejectionRows503533[0] = {
    ...rootRenderGate.privatePromotionRejectionRows503533[0],
    compatibilityClaimed: true,
    comparedToReactDomOracle: true,
    promotion: "accepted",
    publicCompatibilityClaims: {
      ...rootRenderGate.privatePromotionRejectionRows503533[0]
        .publicCompatibilityClaims,
      publicRootCompatibilitySurface: true,
      publicTestRendererCompatibilityClaimed: true
    },
    publicRootCompatibilitySurface: true,
    publicTestRendererCompatibilityClaimed: true
  };

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    rootRenderGateResult: rootRenderGate
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-promotion-503-533-claims-compatibility-while-public-facade-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-promotion-503-533-gate-public-claim-leaked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-promotion-503-533-row-not-rejected"
    )
  );
});

test("React DOM public root facade gate rejects portal root-render compatibility leaks", () => {
  const rootRenderGate = clone(
    evaluateReactDomRootRenderE2EConformanceGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle
    })
  );
  rootRenderGate.summary.portalRootRenderCompatibilityClaimed = true;
  rootRenderGate.summary.privatePortalMetadataPromotesPublicRootRender = true;
  rootRenderGate.portalRootRenderGate.summary.compatibilityClaimed = true;
  rootRenderGate.portalRootRenderGate.summary
    .privatePortalMetadataPromotesPublicRootRender = true;
  rootRenderGate.portalRootRenderBlockedRows[0] = {
    ...rootRenderGate.portalRootRenderBlockedRows[0],
    compatibilityClaimed: true,
    privatePortalMetadataPromotesPublicRootRender: true,
    publicRootCompatibilitySurface: true
  };

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    rootRenderGateResult: rootRenderGate
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-portal-claims-compatibility-while-public-facade-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus === "root-render-portal-blocked-row-not-fail-closed"
    )
  );
});

test("React DOM public root facade gate rejects private bridge side effects or compatibility claims", () => {
  const privateBoundary = clone(inspectReactDomPrivateRootBridgeBoundary());
  privateBoundary.create.nativeExecution = true;
  privateBoundary.admissions.unmount.compatibilityClaimed = true;
  privateBoundary.sideEffects.listenerRegistrationCount = 1;

  const claimedClientRootOracle = clone(clientRootOracle);
  claimedClientRootOracle.conformanceClaims.compatibilityClaimed = true;

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle: claimedClientRootOracle,
    localPublicFacadeBoundary: inspectReactDomRootPublicFacadeBoundary(),
    privateRootBridgeBoundary: privateBoundary
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus === "private-root-bridge-native-execution-enabled"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus === "private-root-bridge-produced-public-side-effects"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "private-root-bridge-admission-row-not-record-only"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "client-root-oracle-claims-compatibilityClaimed-while-blocked"
    )
  );
});

test("React DOM private root bridge inspection stays record-only", () => {
  const privateBoundary = inspectReactDomPrivateRootBridgeBoundary();

  assert.equal(privateBoundary.create.requestType, "createRoot");
  assert.equal(privateBoundary.create.nativeExecution, false);
  assert.equal(
    privateBoundary.create.markerGuard.action,
    "defer-mark-container-as-root"
  );
  assert.equal(
    privateBoundary.create.listenerGuard.action,
    "defer-listen-to-all-supported-events"
  );
  assert.equal(privateBoundary.render.requestType, "root.render");
  assert.equal(privateBoundary.render.nativeExecution, false);
  assert.equal(privateBoundary.unmount.requestType, "root.unmount");
  assert.equal(privateBoundary.unmount.nativeExecution, false);
  assert.equal(privateBoundary.secondUnmount.noOp, true);
  assert.equal(privateBoundary.renderAfterUnmount.status, "throws");
  assert.equal(
    privateBoundary.renderAfterUnmount.thrown.code,
    "FAST_REACT_DOM_UNMOUNTED_ROOT"
  );
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(privateBoundary.admissions).map(([key, admission]) => [
        key,
        {
          admissionStatus: admission.admissionStatus,
          compatibilityClaimed: admission.compatibilityClaimed,
          executionStatus: admission.executionStatus,
          operation: admission.operation,
          transition: admission.lifecyclePrerequisites.lifecycleTransition
        }
      ])
    ),
    {
      create: {
        admissionStatus: "admitted-private-root-bridge-request-record",
        compatibilityClaimed: false,
        executionStatus: "blocked-private-root-bridge-execution",
        operation: "create",
        transition: "none->created"
      },
      render: {
        admissionStatus: "admitted-private-root-bridge-request-record",
        compatibilityClaimed: false,
        executionStatus: "blocked-private-root-bridge-execution",
        operation: "render",
        transition: "created->rendered"
      },
      unmount: {
        admissionStatus: "admitted-private-root-bridge-request-record",
        compatibilityClaimed: false,
        executionStatus: "blocked-private-root-bridge-execution",
        operation: "unmount",
        transition: "rendered->unmounted"
      },
      secondUnmount: {
        admissionStatus: "admitted-private-root-bridge-request-record",
        compatibilityClaimed: false,
        executionStatus: "blocked-private-root-bridge-execution",
        operation: "unmount",
        transition: "unmounted->unmounted"
      }
    }
  );
  assert.equal(privateBoundary.sideEffects.mutationCount, 0);
  assert.equal(privateBoundary.sideEffects.listenerRegistrationCount, 0);

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    privateRootBridgeBoundary: privateBoundary
  });
  assert.deepEqual(
    new Set(gate.blockedPrivateBridgeRows.map((row) => row.gateStatus)),
    new Set([REACT_DOM_ROOT_PUBLIC_FACADE_BRIDGE_RECORD_ONLY_STATUS])
  );
  assert.equal(gate.blockedPrivateBridgeRows.length, 8);
});

test("React DOM explicit private createRoot mark/listen gate stays separate from public placeholders", () => {
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );

  const document = createPrivateGateDocument(
    "public-facade-private-mark-listen",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const bridge = rootBridge.createPrivateRootBridgeShell({
    sideEffectIdPrefix: "public-gate-side-effect"
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);

  assert.equal(
    sideEffects.sideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_APPLIED
  );
  assert.equal(sideEffects.markerWrites, true);
  assert.equal(sideEffects.listenerInstallation, true);
  assert.equal(sideEffects.nativeExecution, false);
  assert.equal(sideEffects.reconcilerExecution, false);
  assert.equal(sideEffects.domMutation, false);
  assert.equal(sideEffects.compatibilityClaimed, false);
  assert.equal(rootMarkers.getContainerRoot(container), create.owner);
  assert.equal(container.__registrations.length, 138);
  assert.equal(document.__registrations.length, 1);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assertMinimalPublicCreateRootBoundary(publicBoundary);

  const defaultPrivateBoundary = inspectReactDomPrivateRootBridgeBoundary();
  assert.equal(defaultPrivateBoundary.sideEffects.listenerRegistrationCount, 0);
  assert.equal(defaultPrivateBoundary.sideEffects.mutationCount, 0);
  assert.equal(defaultPrivateBoundary.sideEffects.containerMarker.propertyCount, 0);

  const cleanup = bridge.revertCreateRootSideEffects(sideEffects);
  assert.equal(
    cleanup.sideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_REVERTED
  );
  assert.equal(rootMarkers.inspectContainerRootMarker(container).propertyCount, 0);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
});

function createHydrateRootExecutionPreflightScenario(label, options = {}) {
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const eventListener = require(
    path.join(repoRoot, "packages/react-dom/src/events/react-dom-event-listener.js")
  );
  const eventSystemFlags = require(
    path.join(repoRoot, "packages/react-dom/src/events/event-system-flags.js")
  );
  const pluginEventSystem = require(
    path.join(repoRoot, "packages/react-dom/src/events/plugin-event-system.js")
  );
  const document = createPrivateGateDocument(label, domContainer);
  const container = createPrivateGateElement("DIV", document, domContainer);
  const target = createPrivateGateElement("BUTTON", document, domContainer);
  const textNodes =
    options.textMismatchRows === true
      ? [
          createPrivateGateTextNode("server text one", document, domContainer),
          createPrivateGateTextNode("server text two", document, domContainer)
        ]
      : options.textMismatch === true
        ? [createPrivateGateTextNode("server text", document, domContainer)]
        : [];
  const textNode = textNodes.length === 0 ? null : textNodes[0];
  const start = createPrivateGateCommentNode("$", document, domContainer);
  const end = createPrivateGateCommentNode("/$", document, domContainer);
  start.parentNode = container;
  target.parentNode = container;
  for (const node of textNodes) {
    node.parentNode = container;
  }
  end.parentNode = container;
  container.childNodes =
    textNodes.length === 0
      ? [start, target, end]
      : [start, target, ...textNodes, end];

  const hydrationOptions = {
    identifierPrefix: `${label}-`
  };
  if (typeof options.onRecoverableError === "function") {
    hydrationOptions.onRecoverableError = options.onRecoverableError;
  }

  const preflight =
    rootBridge.createPrivateHydrateRootPublicFacadePreflight({
      hydrateIdPrefix: `${label}-root`,
      publicFacadeHydratePreflightIdPrefix: `${label}-preflight`,
      requestIdPrefix: `${label}-request`
    });
  const initialChildren = {
    props: {
      children:
        options.textMismatchRows === true
          ? ["client text one", "client text two"]
          : options.textMismatch === true
          ? "client text"
          : `${label} child`
    },
    type: "App"
  };
  const hydrateRecord = preflight.hydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );
  const wrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      "click",
      eventSystemFlags.IS_CAPTURE_PHASE
    );
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      wrapper,
      {
        target,
        type: "click"
      }
    );
  const targetClaimRecord = preflight.preflightTargetClaiming(
    hydrateRecord,
    dispatchRecord,
    {
      source: `${label}-target-claiming`
    }
  );
  const eventReplayRecord = preflight.preflightEventReplay(
    targetClaimRecord,
    {
      source: `${label}-event-replay`
    }
  );

  return {
    container,
    dispatchRecord,
    document,
    eventReplayRecord,
    hydrateRecord,
    hydrationOptions,
    initialChildren,
    preflight,
    rootBridge,
    target,
    targetClaimRecord,
    textNode,
    textNodes
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertHydrateRootPreflightEvidenceBlocked(rows) {
  const blockedBooleanFields = [
    "browserDomEventCompatibilityClaimed",
    "canHydrate",
    "compatibilityClaimed",
    "containerMarked",
    "domMutated",
    "domMutation",
    "eventDispatch",
    "eventReplayDispatchAttempted",
    "eventReplayInstalled",
    "eventReplaySupported",
    "eventsReplayed",
    "hydrateInstanceCalled",
    "hydrateTextInstanceCalled",
    "hydration",
    "hydrationReplaySupported",
    "listenerInstallation",
    "listenersAttached",
    "markerWrites",
    "nativeEventRedispatched",
    "nativeExecution",
    "onRecoverableErrorInvoked",
    "pluginDispatchEventForPluginEventSystemCalled",
    "privateExecution",
    "publicCreateRootEnabled",
    "publicDispatchEnabled",
    "publicHydrateRootEnabled",
    "publicHydrateRootSupported",
    "publicHydrationCompatibilityClaimed",
    "publicHydrationReplayCompatibilityClaimed",
    "publicHydrationTargetClaimed",
    "publicOnRecoverableErrorInvoked",
    "publicRootBehaviorChanged",
    "publicRootCompatibilitySurface",
    "publicRootCreated",
    "publicRootExecution",
    "publicRootObjectExposed",
    "queueMutationAllowed",
    "queued",
    "reconcilerExecution",
    "recoverableErrorsQueued",
    "reportGlobalErrorInvoked",
    "replayQueueDrained",
    "replayQueuesDrained",
    "rootErrorCallbacksInvoked",
    "rootErrorUpdatesScheduled",
    "rootScheduled",
    "suspenseHydrationScheduled",
    "syntheticEventCreated",
    "targetClaimExecuted",
    "targetDispatchExecuted",
    "willDispatch",
    "willDrainReplayQueues",
    "willHydrate",
    "willInvokeListeners",
    "willQueueRecoverableErrors",
    "willReplay"
  ];

  for (const row of rows) {
    assert.equal(Object.isFrozen(row), true);
    const rowLabel = row.kind || row.operation || row.status;
    for (const field of blockedBooleanFields) {
      if (Object.prototype.hasOwnProperty.call(row, field)) {
        assert.equal(row[field], false, `${rowLabel}.${field}`);
      }
    }
    if (Object.prototype.hasOwnProperty.call(row, "listenerInvocationCount")) {
      assert.equal(row.listenerInvocationCount, 0, rowLabel);
    }
    if (
      Object.prototype.hasOwnProperty.call(
        row,
        "rootErrorCallbackInvocationCount"
      )
    ) {
      assert.equal(row.rootErrorCallbackInvocationCount, 0, rowLabel);
    }
  }
}

function createPrivateGateDocument(label, domContainer) {
  const document = createPrivateGateEventTarget({
    label,
    nodeName: "#document",
    nodeType: domContainer.DOCUMENT_NODE
  });
  document.ownerDocument = document;
  document.defaultView = createPrivateGateEventTarget({
    label: `${label}-window`
  });
  document.createElement = function createPrivateGateFakeElement(tagName) {
    return createPrivateGateElement(String(tagName).toUpperCase(), this, domContainer);
  };
  document.createTextNode = function createPrivateGateFakeText(text) {
    return createPrivateGateTextNode(String(text), this, domContainer);
  };
  return document;
}

function createPrivateGateElement(nodeName, ownerDocument, domContainer) {
  return createPrivateGateEventTarget({
    nodeName,
    nodeType: domContainer.ELEMENT_NODE,
    ownerDocument
  });
}

function createPrivateGateLiveRootContainer(label, domContainer) {
  const rawDocument = createPrivateGateDocument(
    `${label}-document`,
    domContainer
  );
  const document = guardPrivateGateLiveRootContainer(
    rawDocument,
    `${label}-document`
  );
  rawDocument.ownerDocument = document;
  const rawContainer = createPrivateGateElement(
    "DIV",
    document,
    domContainer
  );
  const container = guardPrivateGateLiveRootContainer(
    rawContainer,
    `${label}-container`
  );
  return { container, document };
}

function guardPrivateGateLiveRootContainer(target, label) {
  function fail(operation) {
    throw new Error(`Unexpected live root preflight ${operation} on ${label}`);
  }

  target.addEventListener = function addEventListener() {
    fail("addEventListener");
  };
  target.removeEventListener = function removeEventListener() {
    fail("removeEventListener");
  };
  target.appendChild = function appendChild() {
    fail("appendChild");
  };
  target.insertBefore = function insertBefore() {
    fail("insertBefore");
  };
  target.removeChild = function removeChild() {
    fail("removeChild");
  };
  target.createElement = function createElement() {
    fail("createElement");
  };
  target.createTextNode = function createTextNode() {
    fail("createTextNode");
  };
  Object.defineProperty(target, "textContent", {
    configurable: true,
    enumerable: true,
    get() {
      return "";
    },
    set() {
      fail("textContent write");
    }
  });

  return new Proxy(target, {
    defineProperty(source, property, descriptor) {
      if (isPrivateGateLiveRootPreflightWriteKey(property)) {
        fail(`define ${String(property)}`);
      }
      return Reflect.defineProperty(source, property, descriptor);
    },
    deleteProperty(source, property) {
      if (isPrivateGateLiveRootPreflightWriteKey(property)) {
        fail(`delete ${String(property)}`);
      }
      return Reflect.deleteProperty(source, property);
    },
    set(source, property, value, receiver) {
      if (isPrivateGateLiveRootPreflightWriteKey(property)) {
        fail(`write ${String(property)}`);
      }
      return Reflect.set(source, property, value, receiver);
    }
  });
}

function isPrivateGateLiveRootPreflightWriteKey(property) {
  const key = String(property);
  return (
    key.startsWith("__reactContainer$") ||
    key.startsWith("__reactEvents$") ||
    key.startsWith("_reactListening")
  );
}

function createPrivateGateTextNode(text, ownerDocument, domContainer) {
  const target = createPrivateGateEventTarget({
    __fastReactFakeHydrationTextNode: true,
    nodeName: "#text",
    nodeType: domContainer.TEXT_NODE,
    ownerDocument
  });
  target.writeLog = [];
  target.textContent = text;
  Object.defineProperties(target, {
    data: {
      configurable: true,
      enumerable: true,
      get() {
        return this.textContent;
      },
      set(value) {
        const textValue = String(value);
        this.writeLog.push(["data", textValue]);
        this.textContent = textValue;
      }
    },
    nodeValue: {
      configurable: true,
      enumerable: true,
      get() {
        return this.textContent;
      },
      set(value) {
        const textValue = String(value);
        this.writeLog.push(["nodeValue", textValue]);
        this.textContent = textValue;
      }
    }
  });
  return target;
}

function createPrivateGateCommentNode(data, ownerDocument, domContainer) {
  return createPrivateGateEventTarget({
    data,
    nodeName: "#comment",
    nodeType: domContainer.COMMENT_NODE,
    ownerDocument
  });
}

function createPrivateGateEventTarget(fields) {
  const target = {
    ...fields,
    attributeLog: [],
    attributes: new Map(),
    childNodes: [],
    __mutationLog: [],
    mutationLog: [],
    __registrations: [],
    parentNode: null,
    addEventListener(type, listener, options) {
      this.__registrations.push({
        listener,
        options,
        type
      });
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
    },
    appendChild(child) {
      detachPrivateGateChild(child);
      this.childNodes.push(child);
      child.parentNode = this;
      this.__mutationLog.push({ child, type: "appendChild" });
      this.mutationLog.push(["appendChild", child.nodeName]);
      return child;
    },
    insertBefore(child, beforeChild) {
      if (beforeChild.parentNode !== this) {
        throw new Error("Cannot insert before a child from another parent.");
      }
      detachPrivateGateChild(child);
      const index = this.childNodes.indexOf(beforeChild);
      this.childNodes.splice(index, 0, child);
      child.parentNode = this;
      this.__mutationLog.push({ beforeChild, child, type: "insertBefore" });
      this.mutationLog.push([
        "insertBefore",
        child.nodeName,
        beforeChild.nodeName
      ]);
      return child;
    },
    removeChild(child) {
      if (child.parentNode !== this) {
        throw new Error("Cannot remove a child from another parent.");
      }
      detachPrivateGateChild(child);
      this.__mutationLog.push({ child, type: "removeChild" });
      this.mutationLog.push(["removeChild", child.nodeName]);
      return child;
    },
    setAttribute(name, value) {
      const attributeName = String(name);
      const stringValue = String(value);
      this.attributes.set(attributeName, stringValue);
      this.attributeLog.push(["setAttribute", attributeName, stringValue]);
    },
    removeAttribute(name) {
      const attributeName = String(name);
      const hadAttribute = this.attributes.has(attributeName);
      this.attributes.delete(attributeName);
      this.attributeLog.push(["removeAttribute", attributeName, hadAttribute]);
    },
    hasAttribute(name) {
      return this.attributes.has(String(name));
    },
    getAttribute(name) {
      const attributeName = String(name);
      return this.attributes.has(attributeName)
        ? this.attributes.get(attributeName)
        : null;
    }
  };
  let textContent = "";
  Object.defineProperty(target, "textContent", {
    configurable: true,
    enumerable: true,
    get() {
      if (this.childNodes.length > 0) {
        return this.childNodes.map((child) => child.textContent).join("");
      }
      return textContent;
    },
    set(value) {
      for (const child of [...this.childNodes]) {
        detachPrivateGateChild(child);
      }
      textContent = String(value);
      this.__mutationLog.push({ type: "textContent", value });
      this.mutationLog.push(["textContent", textContent]);
    }
  });
  Object.defineProperties(target, {
    firstChild: {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes[0] || null;
      }
    },
    lastChild: {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes[this.childNodes.length - 1] || null;
      }
    }
  });
  return target;
}

function detachPrivateGateChild(child) {
  if (child == null || typeof child !== "object") {
    throw new Error("Expected a fake-DOM child object.");
  }
  if (child.parentNode == null) {
    child.parentNode = null;
    return;
  }
  const siblings = child.parentNode.childNodes;
  const index = siblings.indexOf(child);
  if (index !== -1) {
    siblings.splice(index, 1);
  }
  child.parentNode = null;
}

function createPrivateGateRootWorkLoopFinishedWorkMetadata(
  rootBridge,
  options
) {
  return {
    source: rootBridge.ROOT_WORK_LOOP_FINISHED_WORK_METADATA_SOURCE,
    status: rootBridge.ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS,
    metadataRevision:
      rootBridge.ROOT_WORK_LOOP_FINISHED_WORK_METADATA_REVISION,
    facade: {
      rootId: options.rootId,
      rootTag: options.rootTag,
      renderUpdateId: options.renderUpdateId,
      hostType: options.hostType,
      hostOutputShape: "host-component",
      hostComponentCount: 1,
      hostTextCount: 1,
      textContent: options.textContent
    },
    completeWork: {
      rootChildTag: "HostComponent",
      completedChildTag: "HostComponent",
      hostTextChildTag: "HostText",
      childTags: ["HostComponent", "HostText"]
    },
    pending: {
      recordsFinishedWork: true,
      pendingWorkMatchesFinishedWork: true,
      renderLanes: "Default",
      finishedLanes: "Default",
      remainingLanes: "NoLanes"
    },
    commit: {
      commitOrderAfterPendingRecord: true,
      consumedFinishedWorkRecord: true,
      finishedWorkAfterCommit: null,
      finishedLanesAfterCommit: "NoLanes",
      renderPhaseWorkAfterCommit: null,
      mutationExecutionBlocked: true,
      publicRootRenderingBlocked: true,
      effectsRefsAndHydrationBlocked: true
    },
    placement: {
      tag: "HostComponent",
      applyKind: "append-placement-to-container",
      siblingStatus: "append"
    }
  };
}

function createRootCommitHostComponentUpdateRecordForConformance(options) {
  return {
    kind: "commit-host-component-update",
    tag: "HostComponent",
    source: {
      kind: "Update"
    },
    root: {
      slot: 3
    },
    hostRoot: {
      slot: 4
    },
    parent: {
      slot: 4
    },
    parentTag: "HostRoot",
    fiber: {
      slot: 12 + (options.recordIndex || 0)
    },
    alternateFiber: {
      slot: 8 + (options.recordIndex || 0)
    },
    stateNodeRaw: options.stateNodeRaw,
    pendingPropsRaw: 3003,
    memoizedPropsRaw: 3003,
    alternateMemoizedPropsRaw: 3001
  };
}

function createRootCommitHostTextUpdateRecordForConformance(options) {
  return {
    kind: "commit-host-text-update",
    tag: "HostText",
    source: {
      kind: "Update"
    },
    root: {
      slot: 3
    },
    hostRoot: {
      slot: 4
    },
    parent: {
      slot: 12
    },
    parentTag: "HostComponent",
    fiber: {
      slot: 40 + (options.recordIndex || 0)
    },
    alternateFiber: {
      slot: 36 + (options.recordIndex || 0)
    },
    stateNodeRaw: options.stateNodeRaw,
    pendingPropsRaw: 4003,
    memoizedPropsRaw: 4003,
    alternateMemoizedPropsRaw: 4001
  };
}

function attributeEntries(node) {
  return [...node.attributes.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  );
}
