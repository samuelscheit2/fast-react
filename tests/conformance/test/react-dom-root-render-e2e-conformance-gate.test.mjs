import "./react-dom-root-render-e2e-conformance-gate.mjs";

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const reactDomClient = require("../../../packages/react-dom/client.js");
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
  assert.throws(() => reactDomClient.createRoot(document.createElement("div")), {
    code: "FAST_REACT_UNIMPLEMENTED"
  });

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
  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild.textContent, "updated conformance update");
  assert.deepEqual(attributeEntries(container.firstChild), [
    ["class", "conformance-updated"],
    ["data-phase", "stable"],
    ["id", "conformance-host"]
  ]);
  assert.throws(() => reactDomClient.createRoot(document.createElement("div")), {
    code: "FAST_REACT_UNIMPLEMENTED"
  });

  const initialPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      initialDiagnostic
    );
  initialPayload.bridge.cleanupInitialRenderHostOutput(
    initialPayload.hostOutputHandoff
  );
});

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
