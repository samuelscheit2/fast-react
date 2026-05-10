import "./react-dom-root-render-e2e-conformance-gate.mjs";

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
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
  assert.throws(() => reactDomClient.createRoot(document.createElement("div")), {
    code: "FAST_REACT_UNIMPLEMENTED"
  });

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
  assert.throws(() => reactDomClient.createRoot(document.createElement("div")), {
    code: "FAST_REACT_UNIMPLEMENTED"
  });

  payload.bridge.cleanupInitialRenderHostOutput(payload.hostOutputHandoff);
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
