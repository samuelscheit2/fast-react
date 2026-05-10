import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  findReactDomExportObservation,
  readCheckedReactDomExportOracle
} from "../src/react-dom-export-oracle.mjs";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);

const domContainer = require(
  path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
);
const componentTree = require(
  path.join(repoRoot, "packages/react-dom/src/client/component-tree.js")
);
const eventDispatch = require(
  path.join(repoRoot, "packages/react-dom/src/events/dispatch.js")
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
const rootListeners = require(
  path.join(repoRoot, "packages/react-dom/src/events/root-listeners.js")
);
const reactDom = require(path.join(repoRoot, "packages/react-dom/index.js"));
const reactDomClient = require(
  path.join(repoRoot, "packages/react-dom/client.js")
);
const reactDomPackageJson = require(
  path.join(repoRoot, "packages/react-dom/package.json")
);

const exportOracle = readCheckedReactDomExportOracle();

test("private event dispatch skeleton creates fail-closed records from wrapper metadata", () => {
  const root = createEventTarget("root");
  const child = createNode("BUTTON", domContainer.ELEMENT_NODE, root);
  const rootOwner = {kind: "DispatchTargetRootOwner"};
  const hostOwner = {kind: "DispatchTargetHostOwner"};
  let latestPropsListenerCalls = 0;
  const latestProps = {
    onClick() {
      latestPropsListenerCalls++;
    },
    onClickCapture() {
      latestPropsListenerCalls++;
    }
  };
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  componentTree.attachHostInstanceNode(child, token, latestProps);
  const wrapperRecord = eventListener.createEventListenerWrapperRecordWithPriority(
    root,
    "click",
    rootListeners.IS_CAPTURE_PHASE
  );
  const nativeEvent = createNativeEvent("click", child);

  const dispatchRecord =
    eventDispatch.createEventDispatchRecordFromWrapperRecord(
      wrapperRecord,
      nativeEvent
    );

  assert.equal(
    eventDispatch.createEventDispatchRecordFromWrapperRecord,
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord
  );
  assert.equal(Object.isFrozen(dispatchRecord), true);
  assert.equal(
    dispatchRecord.kind,
    pluginEventSystem.EVENT_DISPATCH_RECORD_KIND
  );
  assert.equal(dispatchRecord.status, "blocked");
  assert.equal(
    dispatchRecord.blockedReason,
    pluginEventSystem.EVENT_DISPATCH_BLOCKED_CODE
  );
  assert.equal(dispatchRecord.domEventName, "click");
  assert.equal(dispatchRecord.nativeEventType, "click");
  assert.equal(dispatchRecord.nativeEventTarget, child);
  assert.equal(dispatchRecord.targetContainer, root);
  assert.equal(dispatchRecord.wrapperRecord, wrapperRecord);
  assert.equal(dispatchRecord.dispatcherName, "dispatchDiscreteEvent");
  assert.equal(dispatchRecord.eventPriorityName, "DiscreteEventPriority");
  assert.equal(dispatchRecord.inCapturePhase, true);
  assert.equal(dispatchRecord.isNonDelegatedEvent, false);
  assert.equal(dispatchRecord.targetInst, null);
  assert.equal(dispatchRecord.targetInstStatus, "not-resolved");
  assert.equal(dispatchRecord.targetResolutionStatus, "blocked");
  assert.equal(
    dispatchRecord.targetResolutionBlockedReason,
    pluginEventSystem.EVENT_TARGET_RESOLUTION_BLOCKED_CODE
  );
  assert.equal(
    dispatchRecord.targetNormalizationRecord,
    dispatchRecord.extractionRecord.targetNormalizationRecord
  );
  assert.equal(
    dispatchRecord.targetNormalizationRecord.kind,
    componentTree.EVENT_TARGET_NORMALIZATION_RECORD_KIND
  );
  assert.equal(
    Object.isFrozen(dispatchRecord.targetNormalizationRecord),
    true
  );
  assert.equal(
    dispatchRecord.targetNormalizationRecord.status,
    "mounted-host-instance"
  );
  assert.equal(
    dispatchRecord.targetNormalizationRecord.mountedHostInstanceFound,
    true
  );
  assert.equal(
    dispatchRecord.targetNormalizationRecord.closestMountedHostInstanceToken,
    token
  );
  assert.equal(
    dispatchRecord.targetNormalizationRecord.directMountedHostInstanceToken,
    token
  );
  assert.equal(
    dispatchRecord.targetNormalizationRecord.closestMountedHostInstanceNode,
    child
  );
  assert.equal(dispatchRecord.targetNormalizationRecord.hostOwner, hostOwner);
  assert.equal(dispatchRecord.targetNormalizationRecord.rootOwner, rootOwner);
  assert.equal(dispatchRecord.targetNormalizationRecord.targetNode, child);
  assert.equal(
    dispatchRecord.targetNormalizationRecord.latestPropsStatus,
    "present"
  );
  assert.equal(
    dispatchRecord.targetListenerLookupRecord,
    dispatchRecord.extractionRecord.targetListenerLookupRecord
  );
  assert.equal(
    dispatchRecord.targetListenerLookupRecord.kind,
    componentTree.EVENT_LISTENER_TARGET_LOOKUP_RECORD_KIND
  );
  assert.equal(
    Object.isFrozen(dispatchRecord.targetListenerLookupRecord),
    true
  );
  assert.equal(
    dispatchRecord.targetListenerLookupRecord.blockedReason,
    componentTree.EVENT_LISTENER_TARGET_LOOKUP_BLOCKED_CODE
  );
  assert.equal(
    dispatchRecord.targetListenerLookupRecord.registrationName,
    "onClickCapture"
  );
  assert.equal(
    dispatchRecord.targetListenerLookupRecord.listenerStatus,
    "present"
  );
  assert.equal(dispatchRecord.targetListenerLookupRecord.listenerFound, true);
  assert.equal(
    dispatchRecord.targetListenerLookupRecord.listenerInvocationCount,
    0
  );
  assert.equal(
    dispatchRecord.targetListenerLookupRecord.willInvokeListener,
    false
  );
  assert.equal(
    dispatchRecord.targetListenerLookupRecord.exposesLatestProps,
    false
  );
  assert.equal(
    dispatchRecord.targetListenerLookupRecord.exposesListener,
    false
  );
  assert.equal(
    Object.hasOwn(dispatchRecord.targetListenerLookupRecord, "latestProps"),
    false
  );
  assert.equal(
    Object.hasOwn(dispatchRecord.targetListenerLookupRecord, "listener"),
    false
  );
  assert.equal(
    dispatchRecord.targetListenerLookupStatus,
    "present"
  );
  assert.equal(
    dispatchRecord.targetListenerLookupBlockedReason,
    componentTree.EVENT_LISTENER_TARGET_LOOKUP_BLOCKED_CODE
  );
  assert.equal(dispatchRecord.targetListenerFound, true);
  assert.equal(
    dispatchRecord.targetListenerRegistrationName,
    "onClickCapture"
  );
  assert.equal(
    dispatchRecord.extractionRecord.targetListenerLookupStatus,
    "present"
  );
  assert.equal(
    dispatchRecord.extractionRecord.targetListenerRegistrationName,
    "onClickCapture"
  );
  assert.equal(dispatchRecord.extractionRecord.targetListenerFound, true);
  assert.equal(
    componentTree.isEventListenerTargetLookupRecord(
      dispatchRecord.targetListenerLookupRecord
    ),
    true
  );
  const lookupPayload =
    componentTree.getEventListenerTargetLookupRecordPayload(
      dispatchRecord.targetListenerLookupRecord
    );
  assert.equal(lookupPayload.latestProps, latestProps);
  assert.equal(lookupPayload.listener, latestProps.onClickCapture);
  assert.equal(lookupPayload.hostInstanceToken, token);
  assert.equal(lookupPayload.hostInstanceNode, child);
  assert.equal(dispatchRecord.targetHostInstanceNode, child);
  assert.equal(dispatchRecord.targetHostInstanceToken, token);
  assert.equal(dispatchRecord.targetHostInstanceStatus, "mounted-host-instance");
  assert.equal(dispatchRecord.willInvokeListeners, false);
  assert.equal(dispatchRecord.listenerInvocationCount, 0);
  assert.equal(dispatchRecord.syntheticEventCount, 0);
  assert.equal(dispatchRecord.publicRootBehaviorChanged, false);
  assert.deepEqual(dispatchRecord.dispatchQueue, {
    entries: [],
    kind: pluginEventSystem.DISPATCH_QUEUE_RECORD_KIND,
    length: 0,
    listenerInvocationCount: 0,
    status: "empty",
    syntheticEventCount: 0
  });
  assert.equal(Object.isFrozen(dispatchRecord.dispatchQueue), true);
  assert.equal(Object.isFrozen(dispatchRecord.dispatchQueue.entries), true);
  assert.equal(nativeEvent.stopPropagationCallCount, 0);
  assert.equal(nativeEvent.preventDefaultCallCount, 0);
  assert.equal(latestPropsListenerCalls, 0);

  assert.equal(wrapperRecord.listener(nativeEvent), undefined);
  assert.equal(nativeEvent.stopPropagationCallCount, 0);
  assert.equal(nativeEvent.preventDefaultCallCount, 0);
  assert.equal(latestPropsListenerCalls, 0);
  assert.equal(componentTree.detachHostInstanceToken(token), token);
});

test("private target listener lookup sees current latest props without dispatching", () => {
  const root = createEventTarget("latest-props-root");
  const child = createNode("BUTTON", domContainer.ELEMENT_NODE, root);
  const rootOwner = {kind: "LatestPropsLookupRootOwner"};
  const hostOwner = {kind: "LatestPropsLookupHostOwner"};
  let firstListenerCalls = 0;
  let secondListenerCalls = 0;
  const firstProps = {
    onClick() {
      firstListenerCalls++;
    }
  };
  const secondProps = {
    onClick() {
      secondListenerCalls++;
    }
  };
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  componentTree.attachHostInstanceNode(child, token, firstProps);
  componentTree.updateLatestPropsForNode(child, secondProps);
  const wrapperRecord = eventListener.createEventListenerWrapperRecordWithPriority(
    root,
    "click",
    0
  );

  const dispatchRecord =
    eventDispatch.createEventDispatchRecordFromWrapperRecord(
      wrapperRecord,
      createNativeEvent("click", child)
    );
  const lookupPayload =
    componentTree.getEventListenerTargetLookupRecordPayload(
      dispatchRecord.targetListenerLookupRecord
    );

  assert.equal(dispatchRecord.targetListenerRegistrationName, "onClick");
  assert.equal(dispatchRecord.targetListenerLookupStatus, "present");
  assert.equal(dispatchRecord.targetListenerFound, true);
  assert.equal(lookupPayload.latestProps, secondProps);
  assert.equal(lookupPayload.listener, secondProps.onClick);
  assert.equal(firstListenerCalls, 0);
  assert.equal(secondListenerCalls, 0);
  assert.equal(root.__registrations.length, 0);
  assert.equal(dispatchRecord.dispatchQueue.length, 0);
  assert.equal(dispatchRecord.syntheticEventCount, 0);
  assert.equal(dispatchRecord.listenerInvocationCount, 0);
  assert.equal(dispatchRecord.willInvokeListeners, false);
  assert.equal(componentTree.detachHostInstanceToken(token), token);
});

test("private listener dispatch entry points return records while installed listeners stay inert", () => {
  const root = createEventTarget("listener-root");
  const listener = rootListeners.listenToNativeEvent("mousemove", false, root);
  const nativeEvent = createNativeEvent("mousemove", root);
  const wrapperRecord = listener.__FAST_REACT_DOM_EVENT_WRAPPER_RECORD__;

  const directDispatchRecord = eventListener.dispatchContinuousEvent(
    wrapperRecord,
    nativeEvent
  );
  const listenerDispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      listener,
      nativeEvent
    );

  assert.equal(directDispatchRecord.kind, pluginEventSystem.EVENT_DISPATCH_RECORD_KIND);
  assert.equal(directDispatchRecord.domEventName, "mousemove");
  assert.equal(directDispatchRecord.eventPriorityName, "ContinuousEventPriority");
  assert.equal(directDispatchRecord.wrapperKind, eventListener.CONTINUOUS_EVENT_WRAPPER);
  assert.equal(listenerDispatchRecord.wrapperRecord, wrapperRecord);
  assert.equal(listenerDispatchRecord.status, "blocked");
  assert.equal(listener(nativeEvent), undefined);
  assert.equal(nativeEvent.stopPropagationCallCount, 0);
  assert.equal(nativeEvent.preventDefaultCallCount, 0);
});

test("plugin extraction records remain deterministic and fail closed for flag variants", () => {
  const root = createEventTarget("plugin-root");
  assert.equal(
    pluginEventSystem.getSimpleEventRegistrationName("click", 0),
    "onClick"
  );
  assert.equal(
    pluginEventSystem.getSimpleEventRegistrationName(
      "click",
      eventSystemFlags.IS_CAPTURE_PHASE
    ),
    "onClickCapture"
  );
  assert.equal(
    pluginEventSystem.getSimpleEventRegistrationName("focusin", 0),
    "onFocus"
  );
  assert.equal(
    pluginEventSystem.getSimpleEventRegistrationName("change", 0),
    null
  );
  const bubbleRecord = eventListener.createEventListenerWrapperRecordWithPriority(
    root,
    "click",
    0
  );
  const nonDelegatedRecord =
    eventListener.createEventListenerWrapperRecordWithPriority(
      root,
      "scroll",
      eventSystemFlags.IS_NON_DELEGATED
    );

  const bubbleDispatch =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      bubbleRecord,
      createNativeEvent("click", root)
    );
  const nonDelegatedDispatch =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      nonDelegatedRecord,
      createNativeEvent("scroll", root)
    );

  assert.equal(bubbleDispatch.extractionRecord.status, "blocked");
  assert.equal(bubbleDispatch.extractionRecord.shouldProcessPolyfillPlugins, true);
  assert.deepEqual(
    bubbleDispatch.extractionRecord.pluginRecords.map((record) => [
      record.pluginName,
      record.extractionStatus
    ]),
    [
      ["simple-event-plugin", "blocked"],
      ["enter-leave-event-plugin", "blocked"],
      ["change-event-plugin", "blocked"],
      ["select-event-plugin", "blocked"],
      ["before-input-event-plugin", "blocked"],
      ["form-action-event-plugin", "blocked"],
      ["scroll-end-event-plugin", "blocked-by-feature-gate"]
    ]
  );

  assert.equal(nonDelegatedDispatch.isNonDelegatedEvent, true);
  assert.equal(
    nonDelegatedDispatch.extractionRecord.shouldProcessPolyfillPlugins,
    false
  );
  assert.deepEqual(
    nonDelegatedDispatch.extractionRecord.pluginRecords.map((record) => [
      record.pluginName,
      record.extractionStatus
    ]),
    [
      ["simple-event-plugin", "blocked"],
      ["enter-leave-event-plugin", "skipped-by-event-system-flags"],
      ["change-event-plugin", "skipped-by-event-system-flags"],
      ["select-event-plugin", "skipped-by-event-system-flags"],
      ["before-input-event-plugin", "skipped-by-event-system-flags"],
      ["form-action-event-plugin", "skipped-by-event-system-flags"],
      ["scroll-end-event-plugin", "blocked-by-feature-gate"]
    ]
  );
});

test("event target normalization reports mounted host diagnostics without enabling dispatch", () => {
  const root = createEventTarget("target-root");
  const element = createNode("SPAN", domContainer.ELEMENT_NODE, root);
  const text = createNode("#text", domContainer.TEXT_NODE, element);
  const rootOwner = {kind: "TargetNormalizationRoot"};
  const hostOwner = {kind: "TargetNormalizationHost"};
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  const svgUse = {
    correspondingUseElement: element,
    nodeName: "use",
    nodeType: domContainer.ELEMENT_NODE
  };
  const wrapperRecord = eventListener.createEventListenerWrapperRecordWithPriority(
    root,
    "click",
    0
  );
  componentTree.attachHostInstanceNode(element, token, {
    onClick() {
      throw new Error("latest props listener must not be invoked");
    }
  });

  const textDispatch =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      wrapperRecord,
      createNativeEvent("click", text)
    );
  assert.equal(
    textDispatch.nativeEventTarget,
    element
  );
  assert.equal(textDispatch.targetInst, null);
  assert.equal(textDispatch.targetInstStatus, "not-resolved");
  assert.equal(textDispatch.targetResolutionStatus, "blocked");
  assert.equal(
    textDispatch.targetNormalizationRecord.status,
    "mounted-host-instance"
  );
  assert.equal(
    textDispatch.targetNormalizationRecord.closestMountedHostInstanceToken,
    token
  );
  assert.equal(
    textDispatch.targetNormalizationRecord.closestMountedHostInstanceNode,
    element
  );
  assert.equal(textDispatch.targetNormalizationRecord.hostOwner, hostOwner);
  assert.equal(textDispatch.targetNormalizationRecord.rootOwner, rootOwner);
  assert.equal(textDispatch.targetHostInstanceToken, token);
  assert.equal(textDispatch.targetHostInstanceNode, element);
  assert.equal(textDispatch.willInvokeListeners, false);
  assert.equal(
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      wrapperRecord,
      {
        srcElement: svgUse,
        type: "click"
      }
    ).nativeEventTarget,
    element
  );
  assert.equal(
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      wrapperRecord,
      {
        type: "click"
      }
    ).nativeEventTarget,
    root
  );
  assert.equal(
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      wrapperRecord,
      createNativeEvent("click", text)
    ).targetInstStatus,
    "not-resolved"
  );
  assert.equal(componentTree.detachHostInstanceToken(token), token);
  const detachedDispatch =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      wrapperRecord,
      createNativeEvent("click", text)
    );
  assert.equal(
    detachedDispatch.targetNormalizationRecord.status,
    "no-mounted-host-instance"
  );
  assert.equal(
    detachedDispatch.targetListenerLookupStatus,
    "no-mounted-host-instance"
  );
  assert.equal(detachedDispatch.targetListenerFound, false);
});

test("invalid dispatch wrapper metadata fails before any native event side effects", () => {
  const nativeEvent = createNativeEvent("click", createEventTarget("invalid"));

  for (const invalidWrapper of [null, {}, { kind: "wrong" }, () => {}]) {
    assert.throws(
      () =>
        pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
          invalidWrapper,
          nativeEvent
        ),
      {
        code: pluginEventSystem.INVALID_EVENT_WRAPPER_RECORD_CODE
      }
    );
  }

  assert.equal(nativeEvent.stopPropagationCallCount, 0);
  assert.equal(nativeEvent.preventDefaultCallCount, 0);
});

test("invalid latest-props listener lookups fail before native event side effects", () => {
  const root = createEventTarget("invalid-listener-root");
  const child = createNode("BUTTON", domContainer.ELEMENT_NODE, root);
  const token = componentTree.createHostInstanceToken(
    {kind: "InvalidListenerHostOwner"},
    {kind: "InvalidListenerRootOwner"}
  );
  const nativeEvent = createNativeEvent("click", child);
  componentTree.attachHostInstanceNode(child, token, {
    disabled: false,
    onClick: "not-a-function"
  });
  const wrapperRecord = eventListener.createEventListenerWrapperRecordWithPriority(
    root,
    "click",
    0
  );

  assert.throws(
    () =>
      pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
        wrapperRecord,
        nativeEvent
      ),
    {
      code: componentTree.INVALID_EVENT_LISTENER_CODE
    }
  );
  assert.equal(nativeEvent.stopPropagationCallCount, 0);
  assert.equal(nativeEvent.preventDefaultCallCount, 0);
  assert.equal(root.__registrations.length, 0);
  assert.equal(componentTree.detachHostInstanceToken(token), token);
});

test("wrong-node listener target lookups fail before native event side effects", () => {
  const root = createEventTarget("wrong-node-listener-root");
  const ownedNode = createNode("BUTTON", domContainer.ELEMENT_NODE, root);
  const wrongNode = createNode("BUTTON", domContainer.ELEMENT_NODE, root);
  const token = componentTree.createHostInstanceToken(
    {kind: "WrongNodeListenerHostOwner"},
    {kind: "WrongNodeListenerRootOwner"}
  );
  const props = {
    onClick() {
      throw new Error("wrong-node listener must not be invoked");
    }
  };
  componentTree.attachHostInstanceNode(ownedNode, token, props);
  wrongNode[componentTree.internalHostInstanceTokenKey] = token;
  wrongNode[componentTree.internalLatestPropsKey] = props;
  const nativeEvent = createNativeEvent("click", wrongNode);
  const wrapperRecord = eventListener.createEventListenerWrapperRecordWithPriority(
    root,
    "click",
    0
  );

  assert.throws(
    () =>
      pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
        wrapperRecord,
        nativeEvent
      ),
    {
      code: componentTree.EVENT_LISTENER_TARGET_LOOKUP_NODE_MISMATCH_CODE
    }
  );
  assert.equal(nativeEvent.stopPropagationCallCount, 0);
  assert.equal(nativeEvent.preventDefaultCallCount, 0);
  assert.equal(root.__registrations.length, 0);
  assert.equal(componentTree.getLatestPropsFromNode(ownedNode), props);
  assert.equal(
    wrongNode[componentTree.internalHostInstanceTokenKey],
    token
  );
  assert.equal(componentTree.detachHostInstanceNode(wrongNode), null);
  assert.equal(componentTree.detachHostInstanceToken(token), token);
});

test("private dispatch skeleton does not change public React DOM exports", () => {
  assert.deepEqual(
    Object.keys(reactDom),
    findReactDomExportObservation(
      exportOracle,
      "default-node-development",
      "."
    ).require.exportKeys
  );
  assert.deepEqual(
    Object.keys(reactDomClient),
    findReactDomExportObservation(
      exportOracle,
      "default-node-development",
      "./client"
    ).require.exportKeys
  );

  const exportedSubpaths = Object.keys(reactDomPackageJson.exports);
  for (const subpath of [
    "./src/events/dispatch",
    "./src/events/event-system-flags",
    "./src/events/get-event-target",
    "./src/events/plugin-event-system"
  ]) {
    assert.equal(exportedSubpaths.includes(subpath), false, subpath);
    assert.equal(exportedSubpaths.includes(`${subpath}.js`), false, subpath);
  }
});

function createEventTarget(label) {
  return {
    __registrations: [],
    label,
    addEventListener(type, listener, options) {
      this.__registrations.push({
        listener,
        options,
        type
      });
    }
  };
}

function createNode(nodeName, nodeType, parentNode) {
  return {
    nodeName,
    nodeType,
    parentNode
  };
}

function createNativeEvent(type, target) {
  return {
    preventDefaultCallCount: 0,
    stopPropagationCallCount: 0,
    target,
    type,
    preventDefault() {
      this.preventDefaultCallCount++;
    },
    stopPropagation() {
      this.stopPropagationCallCount++;
    }
  };
}
