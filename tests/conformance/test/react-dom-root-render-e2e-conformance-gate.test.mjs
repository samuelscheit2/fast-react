import "./react-dom-root-render-e2e-conformance-gate.mjs";

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const React = require("../../../packages/react/index.js");
const reactDomClient = require("../../../packages/react-dom/client.js");
const componentTree = require(
  "../../../packages/react-dom/src/client/component-tree.js"
);
const rootBridge = require(
  "../../../packages/react-dom/src/client/root-bridge.js"
);

test("root render E2E gate keeps private render native handoff metadata below public compatibility", () => {
  const document = createDocument();
  const container = document.createElement("div");
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    rootRenderNativeHandoffIdPrefix: "conformance-render-native-handoff"
  });
  const root = adapter.createRoot(container);
  const handoff = adapter.renderNativeHandoff(root, {
    props: {
      children: "conformance private handoff"
    },
    type: "main"
  });
  const payload =
    rootBridge.getPrivateRootRenderNativeHandoffPayload(handoff);

  assert.equal(
    handoff.handoffStatus,
    rootBridge.ROOT_BRIDGE_ROOT_RENDER_NATIVE_HANDOFF_ACCEPTED
  );
  assert.equal(handoff.privateFacadeRoot, true);
  assert.equal(handoff.rootWorkLoopEvidenceAccepted, true);
  assert.equal(handoff.fakeDomAdmissionAccepted, true);
  assert.equal(handoff.nativeRenderRequestMirrored, true);
  assert.equal(handoff.publicRootExecution, false);
  assert.equal(handoff.publicRootCompatibilitySurface, false);
  assert.equal(handoff.publicRootRenderCompatibilityClaimed, false);
  assert.equal(handoff.nativeExecution, false);
  assert.equal(handoff.reconcilerExecution, false);
  assert.equal(handoff.browserDomMutation, false);
  assert.equal(handoff.hydration, false);
  assert.equal(handoff.compatibilityClaimed, false);
  assert.equal(
    payload.rootWorkLoopFinishedWorkRecord.publicRootRenderingBlocked,
    true
  );
  assert.equal(payload.nativeHandoffRecord.nativeExecution, false);
  assertPublicCreateRootMinimalHostOutput(document);

  payload.bridge.cleanupInitialRenderHostOutput(payload.hostOutputHandoff);
});

test("root render E2E gate accepts private facade root.render fake-DOM execution below public compatibility", () => {
  const document = createDocument();
  const container = document.createElement("div");
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    publicFacadeHostOutputRenderIdPrefix: "conformance-root-render"
  });
  const root = adapter.createRoot(container);
  const element = {
    props: {
      children: "conformance private root.render",
      id: "conformance-root-render"
    },
    type: "main"
  };
  const diagnostic = root.render(element);
  const payload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(diagnostic);
  const hostOutputPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(
      payload.hostOutputHandoff
    );

  assert.equal(
    diagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_APPLIED
  );
  assert.equal(diagnostic.privateFacadeRoot, true);
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.publicRootCompatibilitySurface, false);
  assert.equal(diagnostic.publicRootCreated, false);
  assert.equal(diagnostic.publicRootObjectExposed, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.fakeDomMutation, true);
  assert.equal(diagnostic.browserDomMutation, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.equal(diagnostic.rootWorkLoopPublicRootRenderingBlocked, true);
  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild.nodeName, "MAIN");
  assert.equal(container.textContent, "conformance private root.render");
  assert.equal(
    componentTree.getLatestPropsFromNode(hostOutputPayload.hostNode),
    element.props
  );
  assert.deepEqual(
    adapter.getRootRequestRecords(root).map((record) => record.requestType),
    ["createRoot", "root.render"]
  );
  assertPublicCreateRootMinimalHostOutput(document);

  payload.bridge.cleanupInitialRenderHostOutput(payload.hostOutputHandoff);
});

test("root render E2E gate accepts private nested initial host output below public compatibility", () => {
  const document = createDocument();
  const container = document.createElement("div");
  const childElement = {
    props: {
      children: "conformance nested private root.render",
      id: "conformance-nested-child"
    },
    type: "span"
  };
  const element = {
    props: {
      children: childElement,
      id: "conformance-nested-parent"
    },
    type: "section"
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    initialHostOutputIdPrefix: "conformance-nested-initial",
    requestIdPrefix: "conformance-nested-request",
    rootIdPrefix: "conformance-nested-root",
    rootRenderHostOutputIdPrefix: "conformance-nested-render",
    updateIdPrefix: "conformance-nested-update"
  });
  const create = bridge.createClientRoot(container);
  const metadata = createRootWorkLoopFinishedWorkMetadata({
    childTags: ["HostComponent", "HostComponent", "HostText"],
    hostComponentCount: 2,
    hostOutputShape: "nested-host-component",
    hostTextCount: 1,
    hostType: "section",
    renderUpdateId: "conformance-nested-update:1",
    rootId: create.rootId,
    rootTag: create.rootTag,
    textContent: "conformance nested private root.render"
  });

  const diagnostic = bridge.renderRootHostOutput(create, element, {
    rootWorkLoopFinishedWorkMetadata: metadata
  });
  const payload =
    rootBridge.getPrivateRootRenderHostOutputPayload(diagnostic);
  const hostOutputPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(
      payload.hostOutputHandoff
    );
  const parentNode = container.firstChild;
  const childNode = parentNode.firstChild;
  const textNode = childNode.firstChild;

  assert.equal(
    diagnostic.renderStatus,
    rootBridge.ROOT_BRIDGE_ROOT_RENDER_HOST_OUTPUT_APPLIED
  );
  assert.equal(diagnostic.privateRootRender, true);
  assert.equal(diagnostic.privateFacadeRoot, false);
  assert.equal(diagnostic.hostOutputShape, "nested-host-component");
  assert.equal(diagnostic.hostComponentCount, 2);
  assert.equal(diagnostic.hostTextCount, 1);
  assert.deepEqual(diagnostic.childTags, [
    "HostComponent",
    "HostComponent",
    "HostText"
  ]);
  assert.equal(diagnostic.rootWorkLoopPublicRootRenderingBlocked, true);
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.publicRootCompatibilitySurface, false);
  assert.equal(diagnostic.nativeExecution, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.browserDomMutation, false);
  assert.equal(diagnostic.hydration, false);
  assert.equal(diagnostic.eventDispatch, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.equal(container.childNodes.length, 1);
  assert.equal(parentNode.nodeName, "SECTION");
  assert.equal(childNode.nodeName, "SPAN");
  assert.equal(textNode.nodeValue, "conformance nested private root.render");
  assert.equal(container.textContent, "conformance nested private root.render");
  assert.deepEqual(attributeEntries(parentNode), [
    ["id", "conformance-nested-parent"]
  ]);
  assert.deepEqual(attributeEntries(childNode), [
    ["id", "conformance-nested-child"]
  ]);
  assert.equal(hostOutputPayload.hostNode, parentNode);
  assert.equal(hostOutputPayload.childHostNode, childNode);
  assert.equal(hostOutputPayload.textNode, textNode);
  assert.deepEqual(hostOutputPayload.hostNodes, [parentNode, childNode]);
  assert.equal(
    componentTree.assertMountedHostInstanceToken(
      hostOutputPayload.hostTokens[0]
    ),
    parentNode
  );
  assert.equal(
    componentTree.assertMountedHostInstanceToken(
      hostOutputPayload.hostTokens[1]
    ),
    childNode
  );
  assert.equal(
    componentTree.assertMountedHostInstanceToken(hostOutputPayload.textToken),
    textNode
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(parentNode),
    element.props
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(childNode),
    childElement.props
  );
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
  assertPublicCreateRootMinimalHostOutput(document);

  const cleanup = bridge.cleanupInitialRenderHostOutput(
    payload.hostOutputHandoff
  );
  assert.equal(cleanup.detachedHostInstanceCount, 3);
  assert.equal(container.childNodes.length, 0);
});

test("root render E2E gate accepts private facade root.render unkeyed fragment array fake-DOM execution below public compatibility", () => {
  const document = createDocument();
  const container = document.createElement("div");
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    publicFacadeHostOutputRenderIdPrefix: "conformance-fragment-render"
  });
  const root = adapter.createRoot(container);
  const firstElement = {
    props: {
      children: "conformance fragment first",
      id: "conformance-fragment-first"
    },
    type: "header"
  };
  const secondElement = {
    props: {
      children: "conformance fragment second",
      title: "Conformance fragment second"
    },
    type: "main"
  };
  const element = {
    props: {
      children: [firstElement, secondElement]
    },
    type: Symbol.for("react.fragment")
  };
  const diagnostic = root.render(element);
  const payload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(diagnostic);
  const hostOutputPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(
      payload.hostOutputHandoff
    );

  assert.equal(
    diagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_APPLIED
  );
  assert.equal(diagnostic.hostOutputShape, "fragment");
  assert.equal(diagnostic.hostType, "Fragment");
  assert.equal(diagnostic.hostComponentCount, 2);
  assert.equal(diagnostic.hostTextCount, 2);
  assert.equal(diagnostic.containerChildCount, 2);
  assert.deepEqual(diagnostic.childTags, [
    "Fragment",
    "HostComponent",
    "HostText",
    "HostComponent",
    "HostText"
  ]);
  assert.equal(diagnostic.rootWorkLoopFinishedWorkRootChildTag, "Fragment");
  assert.equal(
    diagnostic.rootWorkLoopFinishedWorkHostTextChildTag,
    "HostText"
  );
  assert.equal(diagnostic.rootWorkLoopPublicRootRenderingBlocked, true);
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.publicRootCompatibilitySurface, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.fakeDomMutation, true);
  assert.equal(diagnostic.browserDomMutation, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.deepEqual(
    diagnostic.acceptedCapabilities.map((capability) => capability.id),
    [
      "public-facade-create-root-record",
      "public-facade-root-render-record",
      "root-marker-setup-cleanup",
      "root-listener-setup-cleanup",
      "create-render-admission",
      "fake-dom-host-output-mutation",
      "component-tree-host-instance-map",
      "latest-props-publication",
      "fake-dom-fragment-array-host-children",
      "root-work-loop-finished-work-handoff"
    ]
  );
  assert.equal(container.childNodes.length, 2);
  assert.equal(container.childNodes[0].nodeName, "HEADER");
  assert.equal(container.childNodes[1].nodeName, "MAIN");
  assert.equal(
    container.textContent,
    "conformance fragment firstconformance fragment second"
  );
  assert.deepEqual(attributeEntries(container.childNodes[0]), [
    ["id", "conformance-fragment-first"]
  ]);
  assert.deepEqual(attributeEntries(container.childNodes[1]), [
    ["title", "Conformance fragment second"]
  ]);
  assert.equal(
    componentTree.getLatestPropsFromNode(hostOutputPayload.hostNodes[0]),
    firstElement.props
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(hostOutputPayload.hostNodes[1]),
    secondElement.props
  );
  assert.deepEqual(
    adapter.getRootRequestRecords(root).map((record) => record.requestType),
    ["createRoot", "root.render"]
  );
  assertPublicCreateRootMinimalHostOutput(document);

  payload.bridge.cleanupInitialRenderHostOutput(payload.hostOutputHandoff);
});

test("private facade root.render update mutates one fake DOM property and text path below public compatibility", () => {
  const document = createDocument();
  const container = document.createElement("div");
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    hostOutputUpdateIdPrefix: "conformance-update-handoff",
    nativeEnvironmentId: 843,
    nativeHandoffIdPrefix: "conformance-update-native",
    publicFacadeHostOutputRenderIdPrefix: "conformance-update-render",
    publicFacadeHostOutputUpdateIdPrefix: "conformance-update-diagnostic",
    requestIdPrefix: "conformance-update-request",
    rootIdPrefix: "conformance-update-root",
    updateIdPrefix: "conformance-update"
  });
  const root = adapter.createRoot(container);
  const initialElement = {
    props: {
      children: "initial conformance update",
      className: "conformance-initial",
      "data-phase": "stable",
      id: "conformance-host"
    },
    type: "main"
  };
  const nextElement = {
    props: {
      children: "updated conformance update",
      className: "conformance-updated",
      "data-phase": "stable",
      id: "conformance-host"
    },
    type: "main"
  };

  const initialDiagnostic = adapter.renderHostOutput(root, initialElement);
  const updateDiagnostic = adapter.updateHostOutput(root, nextElement);
  const updatePayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputUpdatePayload(
      updateDiagnostic
    );
  const updateHandoffPayload =
    rootBridge.getPrivateRootHostOutputUpdateHandoffPayload(
      updatePayload.hostOutputUpdateHandoff
    );

  assert.equal(
    updateDiagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(
    updateDiagnostic.hostOutputUpdateStatus,
    rootBridge.ROOT_BRIDGE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.deepEqual(
    updateDiagnostic.acceptedCapabilities.map((capability) => capability.id),
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
  assert.equal(updateDiagnostic.propertyMutation.mutationRecordCount, 2);
  assert.equal(
    updateDiagnostic.propertyMutation.propertyPayloadEvidence.mutatingRowCount,
    1
  );
  assert.equal(
    updateDiagnostic.propertyMutation.propertyPayloadEvidence.setAttributeCount,
    1
  );
  assert.equal(updateDiagnostic.nativeHandoffId, "conformance-update-native:3");
  assert.equal(
    updateDiagnostic.nativeHandoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(
    updateDiagnostic.nativeRequestKind,
    rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_RENDER
  );
  assert.equal(updateDiagnostic.nativeRequestRecord.environmentId, 843);
  assert.equal(updateDiagnostic.nativeUpdateRequestMirrored, true);
  assert.deepEqual(updateDiagnostic.textMutation, {
    newTextLength: 26,
    oldTextLength: 26,
    status: "mutated"
  });
  assert.equal(updateDiagnostic.latestPropsPublished, true);
  assert.equal(
    updateDiagnostic.latestPropsPublishOrder,
    "after-property-and-text-mutation"
  );
  assert.equal(updateDiagnostic.publicRootExecution, false);
  assert.equal(updateDiagnostic.publicRootCompatibilitySurface, false);
  assert.equal(updateDiagnostic.nativeExecution, false);
  assert.equal(updateDiagnostic.reconcilerExecution, false);
  assert.equal(updateDiagnostic.browserDomMutation, false);
  assert.equal(updateDiagnostic.compatibilityClaimed, false);

  assert.equal(updatePayload.updateRecord.requestType, "root.render");
  assert.deepEqual(
    adapter.getRootRequestRecords(root).map((record) => record.requestType),
    ["createRoot", "root.render", "root.render"]
  );
  assert.equal(updateHandoffPayload.previousProps, initialElement.props);
  assert.equal(updateHandoffPayload.nextProps, nextElement.props);
  assert.equal(updateHandoffPayload.latestPropsPublished, true);
  assert.equal(
    updatePayload.nativeHandoffPayload.sourceRecord,
    updatePayload.updateRecord
  );
  assert.equal(updatePayload.nativeHandoffPayload.value, nextElement);
  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild.textContent, "updated conformance update");
  assert.deepEqual(attributeEntries(container.firstChild), [
    ["class", "conformance-updated"],
    ["data-phase", "stable"],
    ["id", "conformance-host"]
  ]);
  assertPublicCreateRootMinimalHostOutput(document);

  const initialPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      initialDiagnostic
    );
  initialPayload.bridge.cleanupInitialRenderHostOutput(
    initialPayload.hostOutputHandoff
  );
});

test("root render E2E gate keeps private facade root.unmount cleanup below public compatibility", () => {
  const document = createDocument();
  const container = document.createElement("div");
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    nativeEnvironmentId: 844,
    nativeHandoffIdPrefix: "conformance-root-unmount-native",
    publicFacadeHostOutputUnmountCleanupIdPrefix:
      "conformance-root-unmount-cleanup"
  });
  const root = adapter.createRoot(container);
  const render = adapter.renderHostOutput(root, {
    props: {
      children: "conformance private unmount"
    },
    type: "section"
  });
  const renderPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(render);

  assert.equal(container.childNodes.length, 1);
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeRootPayload(root)
      .activeHostOutputRenderRecordCount,
    1
  );
  assert.equal(
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(
      renderPayload.hostOutputHandoff
    ).active,
    true
  );

  const unmount = root.unmount();
  const [cleanup] = adapter.getRootHostOutputUnmountCleanupDiagnostics(root);
  const rootPayloadAfter =
    rootBridge.getPrivateRootPublicFacadeRootPayload(root);

  assert.equal(unmount.requestType, "root.unmount");
  assert.equal(unmount.noOp, false);
  assert.equal(cleanup.cleanupSource, "root.unmount");
  assert.equal(
    cleanup.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT_CLEANED
  );
  assert.equal(
    cleanup.rootMetadataCleanupStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_ROOT_UNMOUNT_METADATA_CLEARED
  );
  assert.equal(cleanup.rootCreateRenderAdmissionMetadataCleared, true);
  assert.equal(cleanup.activeHostOutputMetadataCleared, true);
  assert.equal(cleanup.publicRootUnmounted, false);
  assert.equal(cleanup.publicRootExecution, false);
  assert.equal(cleanup.publicRootCompatibilitySurface, false);
  assert.equal(
    cleanup.nativeHandoffId,
    "conformance-root-unmount-native:3"
  );
  assert.equal(
    cleanup.nativeHandoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(
    cleanup.nativeRequestKind,
    rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_UNMOUNT
  );
  assert.equal(cleanup.nativeRequestRecord.environmentId, 844);
  assert.equal(cleanup.nativeUnmountRequestMirrored, true);
  assert.equal(cleanup.nativeExecution, false);
  assert.equal(cleanup.compatibilityClaimed, false);
  assert.equal(container.childNodes.length, 0);
  assert.equal(rootPayloadAfter.activeHostOutputRenderRecordCount, 0);
  assert.equal(rootPayloadAfter.rootCreateRenderAdmissionActive, false);
  assert.equal(
    rootPayloadAfter.rootLifecycleStatus,
    rootBridge.ROOT_LIFECYCLE_UNMOUNTED
  );
  assert.equal(
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(
      renderPayload.hostOutputHandoff
    ).active,
    false
  );
  assertPublicCreateRootMinimalHostOutput(document);
});

test("root render E2E gate links private facade root.unmount cleanup to ref detach and passive destroy evidence only", () => {
  const document = createDocument();
  const container = document.createElement("div");
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    publicFacadeHostOutputRenderIdPrefix:
      "conformance-root-unmount-ref-passive-render",
    publicFacadeHostOutputUnmountCleanupIdPrefix:
      "conformance-root-unmount-ref-passive-cleanup"
  });
  const root = adapter.createRoot(container);
  let refCallCount = 0;
  function privateUnmountRef() {
    refCallCount += 1;
  }

  root.render({
    privatePassiveDestroy: true,
    props: {
      children: "conformance private unmount ref passive",
      id: "conformance-unmount-ref-passive",
      ref: privateUnmountRef
    },
    type: "section"
  });

  const unmount = root.unmount();
  const [cleanup] = adapter.getRootHostOutputUnmountCleanupDiagnostics(root);
  const payload =
    rootBridge.getPrivateRootPublicFacadeHostOutputUnmountCleanupPayload(
      cleanup
    );

  assert.equal(unmount.noOp, false);
  assert.equal(refCallCount, 0);
  assert.equal(cleanup.cleanupSource, "root.unmount");
  assert.equal(cleanup.unmountRefPassiveEvidenceAccepted, true);
  assert.equal(cleanup.unmountRefDetachMetadataAccepted, true);
  assert.equal(cleanup.unmountPassiveDestroyEvidenceAccepted, true);
  assert.equal(cleanup.unmountRefPassiveEvidenceBeforeHostCleanup, true);
  assert.equal(
    cleanup.unmountRefPassiveEvidence.status,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_UNMOUNT_REF_PASSIVE_EVIDENCE_ACCEPTED
  );
  assert.deepEqual(
    cleanup.acceptedCapabilities.map((capability) => capability.id).slice(-3),
    [
      "root-unmount-ref-detach-metadata",
      "root-unmount-passive-destroy-evidence",
      "ref-passive-before-host-cleanup-order"
    ]
  );
  assert.equal(
    cleanup.blockedCapabilities.some((capability) => capability.id === "refs"),
    false
  );
  assert.equal(
    cleanup.blockedCapabilities.some(
      (capability) => capability.id === "ref-callback-invocation"
    ),
    true
  );
  assert.equal(
    cleanup.blockedCapabilities.some(
      (capability) => capability.id === "passive-effect-execution"
    ),
    true
  );
  assert.equal(cleanup.refEffects, false);
  assert.equal(cleanup.passiveEffects, false);
  assert.equal(cleanup.publicRootUnmounted, false);
  assert.equal(cleanup.publicRootExecution, false);
  assert.equal(cleanup.publicRootCompatibilitySurface, false);
  assert.equal(cleanup.compatibilityClaimed, false);
  assert.equal(payload.unmountRefPassiveEvidence, cleanup.unmountRefPassiveEvidence);
  assert.equal(container.childNodes.length, 0);
  assertPublicCreateRootMinimalHostOutput(document);
});

test("root render E2E gate consumes private root.unmount ref cleanup and passive destroy ordering below public compatibility", () => {
  const document = createDocument();
  const container = document.createElement("div");
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    publicFacadeHostOutputRenderIdPrefix:
      "conformance-root-unmount-ref-cleanup-passive-render",
    publicFacadeHostOutputUnmountCleanupIdPrefix:
      "conformance-root-unmount-ref-cleanup-passive-cleanup"
  });
  const root = adapter.createRoot(container);
  const calls = [];
  function privateUnmountCleanupRef(value) {
    calls.push(`attach:${value.localName}`);
    return function cleanupPrivateUnmountRef() {
      calls.push("cleanup");
    };
  }

  root.render({
    privatePassiveDestroy: {
      consumeRefCleanupExecution: true,
      destroyCount: 1,
      metadataOnly: true
    },
    props: {
      children: "conformance private unmount ref cleanup passive",
      id: "conformance-unmount-ref-cleanup-passive",
      ref: privateUnmountCleanupRef
    },
    type: "section"
  });

  const unmount = root.unmount();
  const [cleanup] = adapter.getRootHostOutputUnmountCleanupDiagnostics(root);
  const evidence = cleanup.unmountRefPassiveEvidence;

  assert.deepEqual(calls, ["attach:section", "cleanup"]);
  assert.equal(unmount.noOp, false);
  assert.equal(cleanup.unmountRefCleanupExecutionAccepted, true);
  assert.equal(cleanup.unmountPassiveDestroyOrderingAccepted, true);
  assert.equal(
    cleanup.unmountRefCleanupPassiveDestroyBeforeHostCleanup,
    true
  );
  assert.deepEqual(evidence.order, [
    "root-unmount-ref-cleanup-handle-metadata",
    "root-unmount-ref-cleanup-execution",
    "root-unmount-passive-destroy-ordering-metadata",
    "fake-dom-host-output-cleanup"
  ]);
  assert.equal(
    evidence.refCleanupExecutionEvidence.status,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_UNMOUNT_REF_CLEANUP_EXECUTION_ACCEPTED
  );
  assert.equal(
    evidence.initialRefAttachEvidence.status,
    rootBridge
      .ROOT_BRIDGE_PUBLIC_FACADE_UNMOUNT_REF_CLEANUP_HANDLE_METADATA_ACCEPTED
  );
  assert.equal(evidence.refCleanupExecutionEvidence.testOnlyExecution, true);
  assert.equal(
    evidence.refCleanupExecutionEvidence.cleanupInvocationAttemptCount,
    1
  );
  assert.equal(
    evidence.passiveDestroyEvidence.destroyOrderingMetadataAccepted,
    true
  );
  assert.equal(
    evidence.passiveDestroyEvidence.rootUnmountPassiveDestroyOrderingStatus,
    rootBridge
      .ROOT_BRIDGE_PUBLIC_FACADE_UNMOUNT_PASSIVE_DESTROY_ORDERING_ACCEPTED
  );
  assert.equal(
    evidence.passiveDestroyEvidence.refCleanupBeforePassiveDestroy,
    true
  );
  assert.equal(
    evidence.passiveDestroyEvidence.passiveDestroyBeforeHostCleanup,
    true
  );
  assert.equal(cleanup.privateRefCleanupExecution, true);
  assert.equal(cleanup.refEffects, false);
  assert.equal(cleanup.passiveEffects, false);
  assert.equal(cleanup.publicRootUnmounted, false);
  assert.equal(cleanup.publicRootExecution, false);
  assert.equal(cleanup.publicRootCompatibilitySurface, false);
  assert.equal(cleanup.compatibilityClaimed, false);
  assert.equal(container.childNodes.length, 0);
  assertPublicCreateRootMinimalHostOutput(document);
});

function createRootWorkLoopFinishedWorkMetadata(options) {
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
      hostOutputShape: options.hostOutputShape,
      hostComponentCount: options.hostComponentCount,
      hostTextCount: options.hostTextCount,
      textContent: options.textContent
    },
    completeWork: {
      rootChildTag: options.rootChildTag || "HostComponent",
      completedChildTag: options.completedChildTag || "HostComponent",
      hostTextChildTag: options.hostTextChildTag || "HostText",
      childTags: options.childTags || ["HostComponent", "HostText"]
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
      tag: options.placementTag || "HostComponent",
      applyKind:
        options.placementApplyKind || "append-placement-to-container",
      siblingStatus: "append"
    }
  };
}

function createDocument() {
  const document = createEventTarget({
    nodeName: "#document",
    nodeType: 9,
    ownerDocument: null
  });
  document.ownerDocument = document;
  document.createElement = (tagName) =>
    createElement(String(tagName).toUpperCase(), document);
  document.createTextNode = (text) => createTextNode(String(text), document);
  return document;
}

function createElement(nodeName, ownerDocument) {
  const element = createEventTarget({
    attributes: new Map(),
    childNodes: [],
    nodeName,
    nodeType: 1,
    ownerDocument,
    parentNode: null,
    tagName: nodeName
  });
  element.appendChild = (child) => {
    detachChild(child);
    child.parentNode = element;
    element.childNodes.push(child);
    return child;
  };
  element.removeChild = (child) => {
    const index = element.childNodes.indexOf(child);
    if (index !== -1) {
      element.childNodes.splice(index, 1);
    }
    child.parentNode = null;
    return child;
  };
  element.setAttribute = (name, value) => {
    element.attributes.set(String(name), String(value));
  };
  element.removeAttribute = (name) => {
    element.attributes.delete(String(name));
  };
  Object.defineProperties(element, {
    firstChild: {
      get() {
        return element.childNodes[0] || null;
      }
    },
    textContent: {
      get() {
        return element.childNodes.map((child) => child.textContent).join("");
      },
      set(value) {
        for (const child of [...element.childNodes]) {
          detachChild(child);
        }
        element.childNodes.length = 0;
        element.__textContent = String(value);
      }
    }
  });
  return element;
}

function createTextNode(text, ownerDocument) {
  return {
    childNodes: [],
    nodeName: "#text",
    nodeType: 3,
    nodeValue: text,
    ownerDocument,
    parentNode: null,
    get textContent() {
      return this.nodeValue;
    },
    set textContent(value) {
      this.nodeValue = String(value);
    }
  };
}

function attributeEntries(element) {
  return Array.from(element.attributes.entries()).sort(([left], [right]) =>
    left.localeCompare(right)
  );
}

function assertPublicCreateRootMinimalHostOutput(document) {
  const container = document.createElement("div");
  const root = reactDomClient.createRoot(container);

  assert.deepEqual(Object.keys(root), ["render", "unmount"]);
  assert.equal(root.render.length, 1);
  assert.equal(root.unmount.length, 0);
  assert.equal(
    root.render(React.createElement("div", { id: "app" }, "hello")),
    undefined
  );
  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild.nodeName, "DIV");
  assert.equal(container.textContent, "hello");
  assert.deepEqual(attributeEntries(container.firstChild), [["id", "app"]]);
  const hostNode = container.firstChild;
  assert.equal(
    root.render(React.createElement("div", { id: "app" }, "again")),
    undefined
  );
  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild, hostNode);
  assert.equal(container.textContent, "again");
  assert.deepEqual(attributeEntries(container.firstChild), [["id", "app"]]);
  assert.equal(root.unmount(), undefined);
  assert.equal(container.childNodes.length, 0);
  assert.equal(container.textContent, "");
  assert.throws(() => root.render(React.createElement("div", null, "stale")), {
    code: "FAST_REACT_UNIMPLEMENTED",
    exportName: "createRoot().render"
  });
  assert.throws(() => root.unmount(), {
    code: "FAST_REACT_UNIMPLEMENTED",
    exportName: "createRoot().unmount"
  });
  const recreatedRoot = reactDomClient.createRoot(container);
  assert.equal(recreatedRoot.render(React.createElement("div", null, 42)), undefined);
  assert.equal(container.textContent, "42");
  assert.equal(recreatedRoot.unmount(), undefined);
}

function createEventTarget(target) {
  target.__registrations = [];
  target.__mutationLog = [];
  target.addEventListener = (type, listener, options) => {
    target.__registrations.push({ listener, options, type });
  };
  target.removeEventListener = (type, listener) => {
    target.__registrations = target.__registrations.filter(
      (entry) => entry.type !== type || entry.listener !== listener
    );
  };
  return target;
}

function detachChild(child) {
  if (child.parentNode == null) {
    return;
  }
  const siblings = child.parentNode.childNodes;
  const index = siblings.indexOf(child);
  if (index !== -1) {
    siblings.splice(index, 1);
  }
  child.parentNode = null;
}
