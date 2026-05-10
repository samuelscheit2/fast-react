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
const listenerRegistry = require(
  path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
);
const rootBridge = require(
  path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
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
  const parent = createNode("DIV", domContainer.ELEMENT_NODE, root);
  const child = createNode("BUTTON", domContainer.ELEMENT_NODE, parent);
  const rootOwner = {kind: "DispatchTargetRootOwner"};
  const parentHostOwner = {kind: "DispatchTargetParentHostOwner"};
  const childHostOwner = {kind: "DispatchTargetChildHostOwner"};
  let latestPropsListenerCalls = 0;
  const parentLatestProps = {
    onClickCapture() {
      latestPropsListenerCalls++;
    }
  };
  const childLatestProps = {
    onClick() {
      latestPropsListenerCalls++;
    },
    onClickCapture() {
      latestPropsListenerCalls++;
    }
  };
  const parentToken = componentTree.createHostInstanceToken(
    parentHostOwner,
    rootOwner
  );
  const childToken = componentTree.createHostInstanceToken(
    childHostOwner,
    rootOwner
  );
  componentTree.attachHostInstanceNode(
    parent,
    parentToken,
    parentLatestProps
  );
  componentTree.attachHostInstanceNode(child, childToken, childLatestProps);
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
  assert.equal(dispatchRecord.targetInst, childToken);
  assert.equal(
    dispatchRecord.targetInstStatus,
    "resolved-component-tree-host-instance"
  );
  assert.equal(dispatchRecord.targetResolutionStatus, "resolved");
  assert.equal(dispatchRecord.targetResolutionBlockedReason, null);
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
    childToken
  );
  assert.equal(
    dispatchRecord.targetNormalizationRecord.directMountedHostInstanceToken,
    childToken
  );
  assert.equal(
    dispatchRecord.targetNormalizationRecord.closestMountedHostInstanceNode,
    child
  );
  assert.equal(
    dispatchRecord.targetNormalizationRecord.hostOwner,
    childHostOwner
  );
  assert.equal(dispatchRecord.targetNormalizationRecord.rootOwner, rootOwner);
  assert.equal(dispatchRecord.targetNormalizationRecord.targetNode, child);
  assert.equal(
    dispatchRecord.targetNormalizationRecord.latestPropsStatus,
    "present"
  );
  assert.equal(
    dispatchRecord.targetDispatchPathRecord.kind,
    componentTree.EVENT_TARGET_DISPATCH_PATH_RECORD_KIND
  );
  assert.equal(Object.isFrozen(dispatchRecord.targetDispatchPathRecord), true);
  assert.equal(
    dispatchRecord.targetDispatchPathStatus,
    "resolved-component-tree-dispatch-path"
  );
  assert.equal(dispatchRecord.targetDispatchPathLength, 2);
  assert.equal(dispatchRecord.targetDispatchPathRecord.targetInst, childToken);
  assert.deepEqual(
    dispatchRecord.targetDispatchPathRecord.entries.map((entry) => [
      entry.kind,
      entry.index,
      entry.targetHostInstanceToken,
      entry.hostOwner,
      entry.latestPropsStatus
    ]),
    [
      [
        componentTree.EVENT_TARGET_DISPATCH_PATH_ENTRY_RECORD_KIND,
        0,
        childToken,
        childHostOwner,
        "present"
      ],
      [
        componentTree.EVENT_TARGET_DISPATCH_PATH_ENTRY_RECORD_KIND,
        1,
        parentToken,
        parentHostOwner,
        "present"
      ]
    ]
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
  assert.equal(dispatchRecord.targetListenerLookupCount, 2);
  assert.deepEqual(
    dispatchRecord.targetListenerLookupRecords.map((record) => [
      record.registrationName,
      record.listenerStatus,
      record.targetHostInstanceToken
    ]),
    [
      ["onClickCapture", "present", childToken],
      ["onClickCapture", "present", parentToken]
    ]
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
  assert.equal(lookupPayload.latestProps, childLatestProps);
  assert.equal(lookupPayload.listener, childLatestProps.onClickCapture);
  assert.equal(lookupPayload.hostInstanceToken, childToken);
  assert.equal(lookupPayload.hostInstanceNode, child);
  assert.equal(dispatchRecord.targetHostInstanceNode, child);
  assert.equal(dispatchRecord.targetHostInstanceToken, childToken);
  assert.equal(dispatchRecord.targetHostInstanceStatus, "mounted-host-instance");
  assert.equal(dispatchRecord.willInvokeListeners, false);
  assert.equal(dispatchRecord.listenerInvocationCount, 0);
  assert.equal(dispatchRecord.syntheticEventCount, 0);
  assert.equal(dispatchRecord.publicRootBehaviorChanged, false);
  assert.equal(
    dispatchRecord.admissionStatus,
    pluginEventSystem.PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS
  );
  assert.equal(dispatchRecord.browserDomEventCompatibilityClaimed, false);
  assert.equal(
    dispatchRecord.dispatchQueue.kind,
    pluginEventSystem.DISPATCH_QUEUE_RECORD_KIND
  );
  assert.equal(dispatchRecord.dispatchQueue.status, "blocked-listener-metadata-recorded");
  assert.equal(dispatchRecord.dispatchQueue.length, 1);
  assert.equal(dispatchRecord.dispatchQueue.listenerCount, 2);
  assert.equal(dispatchRecord.dispatchQueue.listenerInvocationCount, 0);
  assert.equal(dispatchRecord.dispatchQueue.syntheticEventCount, 0);
  assert.equal(dispatchRecord.dispatchQueue.willInvokeListeners, false);
  assert.equal(Object.isFrozen(dispatchRecord.dispatchQueue), true);
  assert.equal(Object.isFrozen(dispatchRecord.dispatchQueue.entries), true);
  const dispatchEntry = dispatchRecord.dispatchQueue.entries[0];
  assert.equal(
    dispatchEntry.kind,
    pluginEventSystem.DISPATCH_QUEUE_ENTRY_RECORD_KIND
  );
  assert.equal(pluginEventSystem.isDispatchQueueEntryRecord(dispatchEntry), true);
  assert.equal(dispatchEntry.pluginName, pluginEventSystem.SIMPLE_EVENT_PLUGIN_NAME);
  assert.equal(dispatchEntry.reactName, "onClick");
  assert.equal(dispatchEntry.registrationName, "onClickCapture");
  assert.equal(dispatchEntry.accumulationOrder, "target-to-root");
  assert.equal(dispatchEntry.processingOrder, "root-to-target");
  assert.equal(dispatchEntry.listenerCount, 2);
  assert.equal(dispatchEntry.syntheticEventStatus, "not-created");
  assert.equal(dispatchEntry.exposesSyntheticEvent, false);
  assert.equal(Object.isFrozen(dispatchEntry.listeners), true);
  assert.equal(Object.isFrozen(dispatchEntry.processingListenerRecords), true);
  assert.deepEqual(
    dispatchEntry.listeners.map((record) => [
      record.kind,
      record.registrationName,
      record.phase,
      record.targetInst,
      record.currentTarget
    ]),
    [
      [
        pluginEventSystem.DISPATCH_LISTENER_RECORD_KIND,
        "onClickCapture",
        "capture",
        childToken,
        child
      ],
      [
        pluginEventSystem.DISPATCH_LISTENER_RECORD_KIND,
        "onClickCapture",
        "capture",
        parentToken,
        parent
      ]
    ]
  );
  assert.deepEqual(
    dispatchEntry.processingListenerRecords.map((record) => record.targetInst),
    [parentToken, childToken]
  );
  for (const listenerRecord of dispatchEntry.listeners) {
    assert.equal(
      pluginEventSystem.isDispatchListenerRecord(listenerRecord),
      true
    );
    assert.equal(listenerRecord.exposesListener, false);
    assert.equal(listenerRecord.exposesLatestProps, false);
    assert.equal(Object.hasOwn(listenerRecord, "listener"), false);
    assert.equal(Object.hasOwn(listenerRecord, "latestProps"), false);
    assert.equal(listenerRecord.willInvokeListener, false);
    assert.equal(listenerRecord.listenerInvocationCount, 0);
  }
  const childDispatchPayload =
    pluginEventSystem.getDispatchListenerRecordPayload(
      dispatchEntry.listeners[0]
    );
  const parentDispatchPayload =
    pluginEventSystem.getDispatchListenerRecordPayload(
      dispatchEntry.listeners[1]
    );
  assert.equal(childDispatchPayload.latestProps, childLatestProps);
  assert.equal(childDispatchPayload.listener, childLatestProps.onClickCapture);
  assert.equal(parentDispatchPayload.latestProps, parentLatestProps);
  assert.equal(parentDispatchPayload.listener, parentLatestProps.onClickCapture);
  assert.equal(nativeEvent.stopPropagationCallCount, 0);
  assert.equal(nativeEvent.preventDefaultCallCount, 0);
  assert.equal(latestPropsListenerCalls, 0);

  assert.equal(wrapperRecord.listener(nativeEvent), undefined);
  assert.equal(nativeEvent.stopPropagationCallCount, 0);
  assert.equal(nativeEvent.preventDefaultCallCount, 0);
  assert.equal(latestPropsListenerCalls, 0);
  assert.equal(componentTree.detachHostInstanceToken(childToken), childToken);
  assert.equal(
    componentTree.detachHostInstanceToken(parentToken),
    parentToken
  );
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
  assert.equal(dispatchRecord.dispatchQueue.length, 1);
  assert.equal(dispatchRecord.dispatchQueue.listenerCount, 1);
  assert.equal(
    dispatchRecord.dispatchQueue.entries[0].listeners[0].registrationName,
    "onClick"
  );
  assert.equal(
    pluginEventSystem.getDispatchListenerRecordPayload(
      dispatchRecord.dispatchQueue.entries[0].listeners[0]
    ).listener,
    secondProps.onClick
  );
  assert.equal(dispatchRecord.syntheticEventCount, 0);
  assert.equal(dispatchRecord.listenerInvocationCount, 0);
  assert.equal(dispatchRecord.willInvokeListeners, false);
  assert.equal(componentTree.detachHostInstanceToken(token), token);
});

test("private single-listener invocation canary invokes one hidden listener without SyntheticEvent or public dispatch", () => {
  const root = createEventTarget("single-listener-canary-root");
  const parent = createNode("DIV", domContainer.ELEMENT_NODE, root);
  const child = createNode("BUTTON", domContainer.ELEMENT_NODE, parent);
  const rootOwner = {kind: "SingleListenerCanaryRootOwner"};
  const parentHostOwner = {kind: "SingleListenerCanaryParentHostOwner"};
  const childHostOwner = {kind: "SingleListenerCanaryChildHostOwner"};
  const calls = [];
  const parentProps = {
    onClick(event) {
      calls.push({
        event,
        name: "parent",
        thisValue: this
      });
      return "parent-return";
    }
  };
  const childProps = {
    onClick(event) {
      calls.push({
        event,
        name: "child",
        thisValue: this
      });
      return "child-return";
    }
  };
  const parentToken = componentTree.createHostInstanceToken(
    parentHostOwner,
    rootOwner
  );
  const childToken = componentTree.createHostInstanceToken(
    childHostOwner,
    rootOwner
  );
  componentTree.attachHostInstanceNode(parent, parentToken, parentProps);
  componentTree.attachHostInstanceNode(child, childToken, childProps);
  const wrapperRecord = eventListener.createEventListenerWrapperRecordWithPriority(
    root,
    "click",
    0
  );
  const nativeEvent = createNativeEvent("click", child);
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      wrapperRecord,
      nativeEvent
    );

  const invocationRecord =
    pluginEventSystem.invokeSingleListenerCanaryFromDispatchRecord(
      dispatchRecord
    );

  assert.equal(Object.isFrozen(invocationRecord), true);
  assert.equal(
    invocationRecord.kind,
    pluginEventSystem.DISPATCH_LISTENER_INVOCATION_CANARY_RECORD_KIND
  );
  assert.equal(
    pluginEventSystem.isDispatchListenerInvocationCanaryRecord(
      invocationRecord
    ),
    true
  );
  assert.equal(
    invocationRecord.status,
    pluginEventSystem.PRIVATE_SINGLE_LISTENER_INVOCATION_CANARY_STATUS
  );
  assert.equal(invocationRecord.invocationStatus, "invoked-single-listener");
  assert.equal(invocationRecord.invocationAttempted, true);
  assert.equal(invocationRecord.listenerInvocationCount, 1);
  assert.equal(invocationRecord.listenerErrorCaptured, false);
  assert.equal(invocationRecord.listenerReturnStatus, "string");
  assert.equal(invocationRecord.dispatchQueueProcessed, false);
  assert.equal(invocationRecord.publicDispatchEnabled, false);
  assert.equal(
    invocationRecord.publicDispatchBlockedReason,
    pluginEventSystem.PUBLIC_EVENT_DISPATCH_BLOCKED_CODE
  );
  assert.equal(invocationRecord.syntheticEventCount, 0);
  assert.equal(invocationRecord.syntheticEventStatus, "blocked-not-created");
  assert.equal(
    invocationRecord.syntheticEventBlockedReason,
    pluginEventSystem.SYNTHETIC_EVENT_BLOCKED_CODE
  );
  assert.equal(invocationRecord.exposesSyntheticEvent, false);
  assert.equal(invocationRecord.exposesCanaryEvent, false);
  assert.equal(invocationRecord.exposesNativeEvent, false);
  assert.equal(invocationRecord.exposesLatestProps, false);
  assert.equal(invocationRecord.exposesListener, false);
  assert.equal(invocationRecord.browserDomEventCompatibilityClaimed, false);
  assert.equal(invocationRecord.publicRootBehaviorChanged, false);
  assert.equal(invocationRecord.registrationName, "onClick");
  assert.equal(invocationRecord.currentTarget, child);
  assert.equal(invocationRecord.targetInst, childToken);
  assert.equal(invocationRecord.selectedFromProcessingOrder, true);
  assert.equal(Object.hasOwn(invocationRecord, "listener"), false);
  assert.equal(Object.hasOwn(invocationRecord, "latestProps"), false);
  assert.equal(Object.hasOwn(invocationRecord, "canaryEvent"), false);
  assert.equal(Object.hasOwn(invocationRecord, "nativeEvent"), false);

  assert.deepEqual(
    calls.map((call) => call.name),
    ["child"]
  );
  assert.equal(calls[0].thisValue, undefined);
  const canaryEvent = calls[0].event;
  assert.equal(Object.isFrozen(canaryEvent), true);
  assert.equal(
    canaryEvent.kind,
    pluginEventSystem.DISPATCH_LISTENER_CANARY_EVENT_KIND
  );
  assert.equal(canaryEvent.status, "private-canary-not-synthetic-event");
  assert.equal(canaryEvent.syntheticEvent, false);
  assert.equal(canaryEvent.currentTarget, child);
  assert.equal(canaryEvent.target, child);
  assert.equal(canaryEvent.targetInst, childToken);
  assert.equal(canaryEvent.type, "click");
  assert.equal(canaryEvent.domEventName, "click");
  assert.equal(canaryEvent.registrationName, "onClick");
  for (const publicEventMember of [
    "nativeEvent",
    "preventDefault",
    "stopPropagation",
    "isDefaultPrevented",
    "isPropagationStopped",
    "persist"
  ]) {
    assert.equal(
      Object.hasOwn(canaryEvent, publicEventMember),
      false,
      publicEventMember
    );
  }

  const invocationPayload =
    pluginEventSystem.getDispatchListenerInvocationCanaryRecordPayload(
      invocationRecord
    );
  assert.equal(invocationPayload.listener, childProps.onClick);
  assert.equal(invocationPayload.latestProps, childProps);
  assert.equal(invocationPayload.canaryEvent, canaryEvent);
  assert.equal(invocationPayload.returnValue, "child-return");
  assert.equal(invocationPayload.error, null);
  assert.equal(invocationPayload.nativeEvent, nativeEvent);
  assert.equal(invocationPayload.dispatchRecord, dispatchRecord);
  assert.equal(dispatchRecord.listenerInvocationCount, 0);
  assert.equal(dispatchRecord.dispatchQueue.listenerInvocationCount, 0);
  assert.equal(dispatchRecord.willInvokeListeners, false);
  assert.equal(
    dispatchRecord.dispatchQueue.singleListenerInvocationCanaryStatus,
    "available-private-helper-only"
  );
  assert.equal(nativeEvent.stopPropagationCallCount, 0);
  assert.equal(nativeEvent.preventDefaultCallCount, 0);
  assert.equal(componentTree.detachHostInstanceToken(childToken), childToken);
  assert.equal(
    componentTree.detachHostInstanceToken(parentToken),
    parentToken
  );
});

test("private single-listener invocation canary captures listener errors without processing the dispatch queue", () => {
  const root = createEventTarget("single-listener-error-root");
  const parent = createNode("DIV", domContainer.ELEMENT_NODE, root);
  const child = createNode("BUTTON", domContainer.ELEMENT_NODE, parent);
  const rootOwner = {kind: "SingleListenerErrorRootOwner"};
  const parentHostOwner = {kind: "SingleListenerErrorParentHostOwner"};
  const childHostOwner = {kind: "SingleListenerErrorChildHostOwner"};
  const calls = [];
  const thrown = new Error("private event listener canary boom");
  const parentProps = {
    onClick(event) {
      calls.push(["parent", event]);
      throw thrown;
    }
  };
  const childProps = {
    onClick(event) {
      calls.push(["child", event]);
      return "child-return";
    }
  };
  const parentToken = componentTree.createHostInstanceToken(
    parentHostOwner,
    rootOwner
  );
  const childToken = componentTree.createHostInstanceToken(
    childHostOwner,
    rootOwner
  );
  componentTree.attachHostInstanceNode(parent, parentToken, parentProps);
  componentTree.attachHostInstanceNode(child, childToken, childProps);
  const wrapperRecord = eventListener.createEventListenerWrapperRecordWithPriority(
    root,
    "click",
    0
  );
  const nativeEvent = createNativeEvent("click", child);
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      wrapperRecord,
      nativeEvent
    );

  const invocationRecord =
    pluginEventSystem.invokeSingleListenerCanaryFromDispatchRecord(
      dispatchRecord,
      {
        listenerIndex: 1
      }
    );

  assert.equal(invocationRecord.listenerIndex, 1);
  assert.equal(invocationRecord.currentTarget, parent);
  assert.equal(invocationRecord.targetInst, parentToken);
  assert.equal(invocationRecord.invocationStatus, "captured-single-listener-error");
  assert.equal(invocationRecord.listenerErrorCaptured, true);
  assert.equal(invocationRecord.listenerInvocationCount, 1);
  assert.equal(invocationRecord.listenerReturnStatus, "not-applicable");
  assert.equal(invocationRecord.dispatchQueueProcessed, false);
  assert.equal(invocationRecord.syntheticEventCount, 0);
  assert.deepEqual(
    calls.map(([name]) => name),
    ["parent"]
  );
  const invocationPayload =
    pluginEventSystem.getDispatchListenerInvocationCanaryRecordPayload(
      invocationRecord
    );
  assert.equal(invocationPayload.listener, parentProps.onClick);
  assert.equal(invocationPayload.latestProps, parentProps);
  assert.equal(invocationPayload.error, thrown);
  assert.equal(invocationPayload.returnValue, undefined);
  assert.equal(dispatchRecord.listenerInvocationCount, 0);
  assert.equal(dispatchRecord.dispatchQueue.listenerInvocationCount, 0);
  assert.equal(nativeEvent.stopPropagationCallCount, 0);
  assert.equal(nativeEvent.preventDefaultCallCount, 0);
  assert.equal(componentTree.detachHostInstanceToken(childToken), childToken);
  assert.equal(
    componentTree.detachHostInstanceToken(parentToken),
    parentToken
  );
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
  assert.equal(
    rootListeners.getLastRootListenerDispatchRecord(listener).domEventName,
    "mousemove"
  );
  assert.equal(
    rootListeners.getLastRootListenerDispatchRecord(listener).targetInst,
    null
  );
  assert.equal(nativeEvent.stopPropagationCallCount, 0);
  assert.equal(nativeEvent.preventDefaultCallCount, 0);
});

test("installed private root listeners record fake DOM dispatch path metadata", () => {
  const root = createEventTarget("installed-listener-root");
  const parent = createNode("DIV", domContainer.ELEMENT_NODE, root);
  const child = createNode("BUTTON", domContainer.ELEMENT_NODE, parent);
  const rootOwner = {kind: "InstalledListenerRootOwner"};
  const parentHostOwner = {kind: "InstalledListenerParentHostOwner"};
  const childHostOwner = {kind: "InstalledListenerChildHostOwner"};
  let listenerCalls = 0;
  const parentProps = {
    onClick() {
      listenerCalls++;
    }
  };
  const childProps = {
    onClick() {
      listenerCalls++;
    }
  };
  const parentToken = componentTree.createHostInstanceToken(
    parentHostOwner,
    rootOwner
  );
  const childToken = componentTree.createHostInstanceToken(
    childHostOwner,
    rootOwner
  );
  componentTree.attachHostInstanceNode(parent, parentToken, parentProps);
  componentTree.attachHostInstanceNode(child, childToken, childProps);
  const listener = rootListeners.listenToNativeEvent("click", false, root);
  const nativeEvent = createNativeEvent("click", child);

  assert.equal(listener(nativeEvent), undefined);
  const dispatchRecord =
    rootListeners.getLastRootListenerDispatchRecord(listener);

  assert.equal(dispatchRecord.kind, pluginEventSystem.EVENT_DISPATCH_RECORD_KIND);
  assert.equal(dispatchRecord.targetInst, childToken);
  assert.equal(dispatchRecord.targetResolutionStatus, "resolved");
  assert.equal(dispatchRecord.targetDispatchPathLength, 2);
  assert.equal(dispatchRecord.dispatchQueue.length, 1);
  assert.equal(dispatchRecord.dispatchQueue.listenerCount, 2);
  assert.equal(
    dispatchRecord.dispatchQueue.entries[0].processingOrder,
    "target-to-root"
  );
  assert.deepEqual(
    dispatchRecord.dispatchQueue.entries[0].listeners.map((record) => [
      record.registrationName,
      record.phase,
      record.targetInst,
      record.currentTarget
    ]),
    [
      ["onClick", "bubble", childToken, child],
      ["onClick", "bubble", parentToken, parent]
    ]
  );
  assert.equal(
    pluginEventSystem.getDispatchListenerRecordPayload(
      dispatchRecord.dispatchQueue.entries[0].listeners[0]
    ).listener,
    childProps.onClick
  );
  assert.equal(
    pluginEventSystem.getDispatchListenerRecordPayload(
      dispatchRecord.dispatchQueue.entries[0].listeners[1]
    ).listener,
    parentProps.onClick
  );
  assert.equal(listenerCalls, 0);
  assert.equal(nativeEvent.stopPropagationCallCount, 0);
  assert.equal(nativeEvent.preventDefaultCallCount, 0);
  assert.equal(componentTree.detachHostInstanceToken(childToken), childToken);
  assert.equal(
    componentTree.detachHostInstanceToken(parentToken),
    parentToken
  );
});

test("installed private root listener canary invokes one listener only after explicit private request", () => {
  const root = createEventTarget("installed-listener-canary-root");
  const parent = createNode("DIV", domContainer.ELEMENT_NODE, root);
  const child = createNode("BUTTON", domContainer.ELEMENT_NODE, parent);
  const rootOwner = {kind: "InstalledListenerCanaryRootOwner"};
  const parentHostOwner = {kind: "InstalledListenerCanaryParentHostOwner"};
  const childHostOwner = {kind: "InstalledListenerCanaryChildHostOwner"};
  const calls = [];
  const parentProps = {
    onClick(event) {
      calls.push(["parent", event]);
    }
  };
  const childProps = {
    onClick(event) {
      calls.push(["child", event]);
    }
  };
  const parentToken = componentTree.createHostInstanceToken(
    parentHostOwner,
    rootOwner
  );
  const childToken = componentTree.createHostInstanceToken(
    childHostOwner,
    rootOwner
  );
  componentTree.attachHostInstanceNode(parent, parentToken, parentProps);
  componentTree.attachHostInstanceNode(child, childToken, childProps);
  const listener = rootListeners.listenToNativeEvent("click", false, root);
  const nativeEvent = createNativeEvent("click", child);

  assert.equal(listener(nativeEvent), undefined);
  assert.deepEqual(calls, []);
  const dispatchRecord =
    rootListeners.getLastRootListenerDispatchRecord(listener);
  assert.equal(dispatchRecord.targetInst, childToken);
  assert.equal(dispatchRecord.listenerInvocationCount, 0);
  assert.equal(dispatchRecord.dispatchQueue.listenerInvocationCount, 0);

  const invocationRecord =
    rootListeners.invokeLastRootListenerSingleListenerCanary(listener);

  assert.equal(
    rootListeners.getLastRootListenerInvocationCanaryRecord(listener),
    invocationRecord
  );
  assert.equal(
    invocationRecord.kind,
    pluginEventSystem.DISPATCH_LISTENER_INVOCATION_CANARY_RECORD_KIND
  );
  assert.equal(invocationRecord.invocationAttempted, true);
  assert.equal(invocationRecord.listenerInvocationCount, 1);
  assert.equal(invocationRecord.currentTarget, child);
  assert.equal(invocationRecord.targetInst, childToken);
  assert.equal(invocationRecord.publicDispatchEnabled, false);
  assert.equal(invocationRecord.syntheticEventCount, 0);
  assert.deepEqual(
    calls.map(([name]) => name),
    ["child"]
  );
  assert.equal(
    pluginEventSystem.getDispatchListenerInvocationCanaryRecordPayload(
      invocationRecord
    ).listener,
    childProps.onClick
  );
  assert.equal(dispatchRecord.listenerInvocationCount, 0);
  assert.equal(dispatchRecord.dispatchQueue.listenerInvocationCount, 0);
  assert.equal(nativeEvent.stopPropagationCallCount, 0);
  assert.equal(nativeEvent.preventDefaultCallCount, 0);
  assert.equal(componentTree.detachHostInstanceToken(childToken), childToken);
  assert.equal(
    componentTree.detachHostInstanceToken(parentToken),
    parentToken
  );
});

test("private root host-output fake click dispatch proves capture before bubble ordering", () => {
  const document = createHostOutputDocument("root-output-event-order");
  const container = document.createElement("div");
  const calls = [];
  const element = {
    props: {
      children: "click target",
      id: "root-output-click-target",
      onClick(event) {
        calls.push({
          currentTarget: event.currentTarget,
          event,
          phase: "bubble",
          registrationName: event.registrationName,
          target: event.target,
          targetInst: event.targetInst
        });
        return "bubble-return";
      },
      onClickCapture(event) {
        calls.push({
          currentTarget: event.currentTarget,
          event,
          phase: "capture",
          registrationName: event.registrationName,
          target: event.target,
          targetInst: event.targetInst
        });
        return "capture-return";
      },
      title: "Root output click target"
    },
    type: "button"
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: "event-order-admission",
    initialHostOutputIdPrefix: "event-order-output",
    sideEffectIdPrefix: "event-order-side-effect"
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const render = bridge.renderContainer(create.handle, element);
  const admission = bridge.admitCreateRenderPath(
    create,
    sideEffects,
    render
  );
  const handoff = bridge.applyInitialRenderHostOutput(admission);
  const hostOutputPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(handoff);
  const targetRecord =
    componentTree.createPrivateRootHostOutputEventTargetRecord(
      hostOutputPayload
    );

  assert.equal(
    targetRecord.kind,
    componentTree.PRIVATE_ROOT_HOST_OUTPUT_EVENT_TARGET_RECORD_KIND
  );
  assert.equal(
    componentTree.isPrivateRootHostOutputEventTargetRecord(targetRecord),
    true
  );
  assert.equal(
    targetRecord.status,
    "validated-private-root-host-output-event-target"
  );
  assert.equal(targetRecord.rootOwner, create.owner);
  assert.equal(targetRecord.targetInst, hostOutputPayload.hostToken);
  assert.equal(targetRecord.latestPropsStatus, "present");
  assert.equal(targetRecord.eventDispatch, false);
  assert.equal(targetRecord.browserDomEventCompatibilityClaimed, false);
  assert.equal(targetRecord.compatibilityClaimed, false);

  const clickRecord =
    rootListeners.invokePrivateRootHostOutputClickDispatchCanary(
      sideEffects.listenerRegistration,
      targetRecord
    );

  assert.equal(Object.isFrozen(clickRecord), true);
  assert.equal(
    clickRecord.kind,
    rootListeners.PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CANARY_RECORD_KIND
  );
  assert.equal(
    rootListeners.isPrivateRootHostOutputClickDispatchCanaryRecord(
      clickRecord
    ),
    true
  );
  assert.equal(
    clickRecord.status,
    rootListeners.PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CANARY_STATUS
  );
  assert.equal(clickRecord.privateCanaryInvocation, true);
  assert.equal(clickRecord.publicDispatchEnabled, false);
  assert.equal(clickRecord.publicRootBehaviorChanged, false);
  assert.equal(clickRecord.browserDomEventCompatibilityClaimed, false);
  assert.equal(clickRecord.fakeDomEventCompatibilityClaimed, false);
  assert.equal(clickRecord.syntheticEventCount, 0);
  assert.equal(clickRecord.syntheticEventStatus, "blocked-not-created");
  assert.equal(clickRecord.dispatchRecordCount, 2);
  assert.equal(clickRecord.invocationRecordCount, 2);
  assert.equal(clickRecord.listenerInvocationCount, 2);
  assert.equal(clickRecord.captureListenerInvocationCount, 1);
  assert.equal(clickRecord.bubbleListenerInvocationCount, 1);
  assert.deepEqual(clickRecord.rootListenerDispatchOrder, [
    "capture",
    "bubble"
  ]);
  assert.deepEqual(
    clickRecord.invocationOrder.map((entry) => [
      entry.phase,
      entry.registrationName,
      entry.targetInst
    ]),
    [
      ["capture", "onClickCapture", hostOutputPayload.hostToken],
      ["bubble", "onClick", hostOutputPayload.hostToken]
    ]
  );
  assert.deepEqual(
    calls.map((call) => [
      call.phase,
      call.registrationName,
      call.currentTarget,
      call.target,
      call.targetInst
    ]),
    [
      [
        "capture",
        "onClickCapture",
        hostOutputPayload.hostNode,
        hostOutputPayload.hostNode,
        hostOutputPayload.hostToken
      ],
      [
        "bubble",
        "onClick",
        hostOutputPayload.hostNode,
        hostOutputPayload.hostNode,
        hostOutputPayload.hostToken
      ]
    ]
  );
  for (const call of calls) {
    assert.equal(Object.isFrozen(call.event), true);
    assert.equal(call.event.syntheticEvent, false);
    assert.equal(call.event.status, "private-canary-not-synthetic-event");
    assert.equal(Object.hasOwn(call.event, "nativeEvent"), false);
    assert.equal(Object.hasOwn(call.event, "preventDefault"), false);
    assert.equal(Object.hasOwn(call.event, "stopPropagation"), false);
  }

  const clickPayload =
    rootListeners.getPrivateRootHostOutputClickDispatchCanaryPayload(
      clickRecord
    );
  assert.equal(clickPayload.targetRecord, targetRecord);
  assert.equal(clickPayload.targetPayload.hostOutputPayload, hostOutputPayload);
  assert.equal(clickPayload.targetPayload.targetNode, hostOutputPayload.hostNode);
  assert.equal(clickPayload.nativeEvent.target, hostOutputPayload.hostNode);
  assert.equal(clickPayload.nativeEvent.preventDefaultCallCount, 0);
  assert.equal(clickPayload.nativeEvent.stopPropagationCallCount, 0);
  assert.equal(clickPayload.captureDispatchRecord.inCapturePhase, true);
  assert.equal(clickPayload.bubbleDispatchRecord.inCapturePhase, false);
  assert.equal(
    clickPayload.captureDispatchRecord.dispatchQueue.listenerCount,
    1
  );
  assert.equal(
    clickPayload.bubbleDispatchRecord.dispatchQueue.listenerCount,
    1
  );
  assert.deepEqual(
    clickPayload.invocationRecords.map((record) => [
      record.phase,
      record.registrationName,
      record.listenerReturnStatus
    ]),
    [
      ["capture", "onClickCapture", "string"],
      ["bubble", "onClick", "string"]
    ]
  );
  const queuePayload =
    pluginEventSystem.getDispatchQueueInvocationCanaryRecordPayload(
      clickPayload.queueInvocationRecord
    );
  assert.equal(queuePayload.dispatchRecords.length, 2);
  assert.deepEqual(
    queuePayload.invocationRecords.map((record) => record.currentTarget),
    [hostOutputPayload.hostNode, hostOutputPayload.hostNode]
  );
  assert.equal(
    clickPayload.queueInvocationRecord.kind,
    pluginEventSystem.DISPATCH_QUEUE_INVOCATION_CANARY_RECORD_KIND
  );
  assert.equal(
    clickPayload.queueInvocationRecord.status,
    pluginEventSystem.PRIVATE_DISPATCH_QUEUE_INVOCATION_CANARY_STATUS
  );
  assert.equal(clickPayload.queueInvocationRecord.publicDispatchEnabled, false);
  assert.equal(
    clickPayload.queueInvocationRecord.exposesSyntheticEvent,
    false
  );
  assert.equal(hostOutputPayload.hostNode.__registrations.length, 0);
  assert.equal(container.__registrations.length, 138);
  assert.equal(document.__registrations.length, 1);
  assert.equal(container.childNodes.length, 1);
  assert.equal(container.textContent, "click target");

  bridge.cleanupInitialRenderHostOutput(handoff);
  bridge.revertCreateRootSideEffects(sideEffects);
});

test("private root host-output SyntheticEvent shape gate records target/currentTarget/defaultPrevented without queue processing", () => {
  const document = createHostOutputDocument("root-output-synthetic-shape");
  const container = document.createElement("div");
  const calls = [];
  const element = {
    props: {
      children: "shape target",
      id: "root-output-synthetic-shape-target",
      onClick(event) {
        calls.push(["bubble", event]);
      },
      onClickCapture(event) {
        calls.push(["capture", event]);
      }
    },
    type: "button"
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: "event-shape-admission",
    initialHostOutputIdPrefix: "event-shape-output",
    sideEffectIdPrefix: "event-shape-side-effect"
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const render = bridge.renderContainer(create.handle, element);
  const admission = bridge.admitCreateRenderPath(
    create,
    sideEffects,
    render
  );
  const handoff = bridge.applyInitialRenderHostOutput(admission);
  const hostOutputPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(handoff);
  const targetRecord =
    componentTree.createPrivateRootHostOutputEventTargetRecord(
      hostOutputPayload
    );

  const shapeGate =
    rootListeners.createPrivateRootHostOutputClickSyntheticEventShapeGate(
      sideEffects.listenerRegistration,
      targetRecord,
      {
        preventDefaultAtPhase: "bubble"
      }
    );

  assert.equal(Object.isFrozen(shapeGate), true);
  assert.equal(
    shapeGate.kind,
    rootListeners.PRIVATE_ROOT_HOST_OUTPUT_SYNTHETIC_EVENT_SHAPE_GATE_RECORD_KIND
  );
  assert.equal(
    rootListeners.isPrivateRootHostOutputSyntheticEventShapeGateRecord(
      shapeGate
    ),
    true
  );
  assert.equal(
    shapeGate.status,
    rootListeners.PRIVATE_ROOT_HOST_OUTPUT_SYNTHETIC_EVENT_SHAPE_GATE_STATUS
  );
  assert.equal(shapeGate.privateSyntheticEventShapeGate, true);
  assert.equal(shapeGate.publicDispatchEnabled, false);
  assert.equal(shapeGate.publicRootBehaviorChanged, false);
  assert.equal(shapeGate.browserDomEventCompatibilityClaimed, false);
  assert.equal(shapeGate.fakeDomEventCompatibilityClaimed, false);
  assert.equal(shapeGate.syntheticEventCompatibilityClaimed, false);
  assert.equal(shapeGate.dispatchQueueProcessed, false);
  assert.equal(shapeGate.listenerInvocationCount, 0);
  assert.equal(shapeGate.willInvokeListeners, false);
  assert.equal(shapeGate.syntheticEventCount, 2);
  assert.equal(shapeGate.syntheticEventShapeCount, 2);
  assert.equal(shapeGate.syntheticEventDispatchCount, 0);
  assert.equal(shapeGate.preventDefaultAtPhase, "bubble");
  assert.equal(shapeGate.preventDefaultShapeCount, 1);
  assert.equal(shapeGate.nativeEventPreventDefaultCallCount, 1);
  assert.equal(shapeGate.nativeEventDefaultPrevented, true);
  assert.deepEqual(shapeGate.rootListenerDispatchOrder, [
    "capture",
    "bubble"
  ]);
  assert.deepEqual(
    shapeGate.syntheticEventShapeOrder.map((entry) => [
      entry.phase,
      entry.registrationName,
      entry.target,
      entry.currentTarget,
      entry.defaultPreventedAfterAction,
      entry.preventDefaultInvoked
    ]),
    [
      [
        "capture",
        "onClickCapture",
        hostOutputPayload.hostNode,
        hostOutputPayload.hostNode,
        false,
        false
      ],
      [
        "bubble",
        "onClick",
        hostOutputPayload.hostNode,
        hostOutputPayload.hostNode,
        true,
        true
      ]
    ]
  );
  assert.deepEqual(calls, []);

  const shapePayload =
    rootListeners.getPrivateRootHostOutputSyntheticEventShapeGatePayload(
      shapeGate
    );
  assert.equal(shapePayload.targetRecord, targetRecord);
  assert.equal(shapePayload.targetPayload.hostOutputPayload, hostOutputPayload);
  assert.equal(shapePayload.nativeEvent.target, hostOutputPayload.hostNode);
  assert.equal(shapePayload.nativeEvent.preventDefaultCallCount, 1);
  assert.equal(shapePayload.nativeEvent.defaultPrevented, true);
  assert.equal(
    pluginEventSystem.isSyntheticEventShapeGateRecord(
      shapePayload.shapeGateRecord
    ),
    true
  );
  assert.equal(
    shapePayload.shapeGateRecord.kind,
    pluginEventSystem.SYNTHETIC_EVENT_SHAPE_GATE_RECORD_KIND
  );
  assert.equal(
    shapePayload.shapeGateRecord.status,
    pluginEventSystem.PRIVATE_SYNTHETIC_EVENT_SHAPE_GATE_STATUS
  );
  assert.equal(shapePayload.shapeGateRecord.dispatchQueueProcessed, false);
  assert.equal(shapePayload.shapeGateRecord.listenerInvocationCount, 0);
  assert.equal(shapePayload.shapeRecords.length, 2);

  const [captureShape, bubbleShape] = shapePayload.shapeRecords;
  assert.equal(
    pluginEventSystem.isSyntheticEventShapeRecord(captureShape),
    true
  );
  assert.equal(
    pluginEventSystem.isSyntheticEventShapeRecord(bubbleShape),
    true
  );
  assert.deepEqual(
    shapePayload.shapeRecords.map((record) => [
      record.kind,
      record.constructorName,
      record.type,
      record.phase,
      record.registrationName,
      record.target,
      record.currentTargetBeforeDispatch,
      record.currentTargetDuringDispatch,
      record.currentTargetAfterDispatch,
      record.defaultPreventedBeforeAction,
      record.defaultPreventedAfterAction,
      record.isDefaultPreventedAfterAction,
      record.preventDefaultInvoked,
      record.nativeEventPreventDefaultCallCountAfterAction
    ]),
    [
      [
        pluginEventSystem.SYNTHETIC_EVENT_SHAPE_RECORD_KIND,
        "SyntheticBaseEvent",
        "click",
        "capture",
        "onClickCapture",
        hostOutputPayload.hostNode,
        null,
        hostOutputPayload.hostNode,
        null,
        false,
        false,
        false,
        false,
        0
      ],
      [
        pluginEventSystem.SYNTHETIC_EVENT_SHAPE_RECORD_KIND,
        "SyntheticBaseEvent",
        "click",
        "bubble",
        "onClick",
        hostOutputPayload.hostNode,
        null,
        hostOutputPayload.hostNode,
        null,
        false,
        true,
        true,
        true,
        1
      ]
    ]
  );
  for (const shapeRecord of shapePayload.shapeRecords) {
    assert.equal(Object.hasOwn(shapeRecord, "syntheticEvent"), false);
    assert.equal(shapeRecord.dispatchQueueProcessed, false);
    assert.equal(shapeRecord.listenerInvocationCount, 0);
    assert.equal(shapeRecord.publicDispatchEnabled, false);
    assert.equal(shapeRecord.exposesSyntheticEvent, false);
    assert.equal(shapeRecord.hasPersist, true);
    assert.equal(shapeRecord.hasPreventDefault, true);
    assert.equal(shapeRecord.targetMatchesNativeEventTarget, true);
    assert.equal(shapeRecord.targetInst, hostOutputPayload.hostToken);
  }

  const captureShapePayload =
    pluginEventSystem.getSyntheticEventShapeRecordPayload(captureShape);
  const bubbleShapePayload =
    pluginEventSystem.getSyntheticEventShapeRecordPayload(bubbleShape);
  assert.equal(
    captureShapePayload.syntheticEvent.constructor.name,
    "SyntheticBaseEvent"
  );
  assert.equal(
    captureShapePayload.syntheticEvent.target,
    hostOutputPayload.hostNode
  );
  assert.equal(captureShapePayload.syntheticEvent.currentTarget, null);
  assert.equal(captureShapePayload.syntheticEvent.defaultPrevented, false);
  assert.equal(
    captureShapePayload.syntheticEvent.isDefaultPrevented(),
    false
  );
  assert.equal(
    bubbleShapePayload.syntheticEvent.target,
    hostOutputPayload.hostNode
  );
  assert.equal(bubbleShapePayload.syntheticEvent.currentTarget, null);
  assert.equal(bubbleShapePayload.syntheticEvent.defaultPrevented, true);
  assert.equal(
    bubbleShapePayload.syntheticEvent.isDefaultPrevented(),
    true
  );
  assert.equal(container.__registrations.length, 138);
  assert.equal(document.__registrations.length, 1);
  assert.equal(container.childNodes.length, 1);

  bridge.cleanupInitialRenderHostOutput(handoff);
  bridge.revertCreateRootSideEffects(sideEffects);
});

test("private root host-output click canary records propagation stop routing without public dispatch", () => {
  const document = createHostOutputDocument("root-output-propagation-stop");
  const container = document.createElement("div");
  const calls = [];
  const element = {
    props: {
      children: "stop target",
      onClick(event) {
        calls.push({
          event,
          phase: "bubble"
        });
      },
      onClickCapture(event) {
        event.stopPropagation();
        calls.push({
          currentTarget: event.currentTarget,
          event,
          phase: "capture",
          stoppedAfter: event.isPropagationStopped(),
          target: event.target
        });
      }
    },
    type: "button"
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: "event-stop-admission",
    initialHostOutputIdPrefix: "event-stop-output",
    sideEffectIdPrefix: "event-stop-side-effect"
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const render = bridge.renderContainer(create.handle, element);
  const admission = bridge.admitCreateRenderPath(
    create,
    sideEffects,
    render
  );
  const handoff = bridge.applyInitialRenderHostOutput(admission);
  const hostOutputPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(handoff);
  const targetRecord =
    componentTree.createPrivateRootHostOutputEventTargetRecord(
      hostOutputPayload
    );

  const clickRecord =
    rootListeners.invokePrivateRootHostOutputClickDispatchCanary(
      sideEffects.listenerRegistration,
      targetRecord,
      {
        enablePropagationStopDiagnostics: true
      }
    );

  assert.equal(clickRecord.publicDispatchEnabled, false);
  assert.equal(clickRecord.syntheticEventCount, 0);
  assert.equal(clickRecord.propagationStopDiagnosticEnabled, true);
  assert.equal(clickRecord.propagationStopped, true);
  assert.equal(clickRecord.propagationStopCallCount, 1);
  assert.equal(clickRecord.propagationStopNativeCallCount, 1);
  assert.equal(clickRecord.propagationSkippedListenerCount, 1);
  assert.equal(clickRecord.listenerInvocationCount, 1);
  assert.equal(clickRecord.captureListenerInvocationCount, 1);
  assert.equal(clickRecord.bubbleListenerInvocationCount, 0);
  assert.equal(clickRecord.listenerErrorCount, 0);
  assert.deepEqual(
    clickRecord.invocationOrder.map((entry) => [
      entry.phase,
      entry.registrationName,
      entry.invocationStatus,
      entry.skippedByPropagationStop
    ]),
    [
      ["capture", "onClickCapture", "invoked-single-listener", false],
      ["bubble", "onClick", "skipped-propagation-stopped", true]
    ]
  );
  assert.deepEqual(
    clickRecord.propagationStopDiagnostics.map((record) => [
      record.kind,
      record.action,
      record.phase,
      record.registrationName,
      record.propagationSkippedListener,
      record.stoppedByRegistrationName
    ]),
    [
      [
        pluginEventSystem.DISPATCH_PROPAGATION_STOP_DIAGNOSTIC_RECORD_KIND,
        "stop-propagation",
        "capture",
        "onClickCapture",
        false,
        "onClickCapture"
      ],
      [
        pluginEventSystem.DISPATCH_PROPAGATION_STOP_DIAGNOSTIC_RECORD_KIND,
        "skip-listener",
        "bubble",
        "onClick",
        true,
        "onClickCapture"
      ]
    ]
  );
  assert.deepEqual(
    calls.map((call) => [
      call.phase,
      call.currentTarget,
      call.target,
      call.stoppedAfter
    ]),
    [
      [
        "capture",
        hostOutputPayload.hostNode,
        hostOutputPayload.hostNode,
        true
      ]
    ]
  );
  assert.equal(typeof calls[0].event.stopPropagation, "function");
  assert.equal(typeof calls[0].event.isPropagationStopped, "function");
  assert.equal(calls[0].event.syntheticEvent, false);
  assert.equal(calls[0].event.propagationStopDiagnosticEnabled, true);

  const clickPayload =
    rootListeners.getPrivateRootHostOutputClickDispatchCanaryPayload(
      clickRecord
    );
  assert.equal(clickPayload.nativeEvent.stopPropagationCallCount, 1);
  assert.equal(
    clickPayload.queueInvocationRecord.propagationStopCallCount,
    1
  );
  assert.equal(
    clickPayload.queueInvocationRecord.propagationSkippedListenerCount,
    1
  );
  assert.equal(hostOutputPayload.hostNode.__registrations.length, 0);
  assert.equal(container.__registrations.length, 138);
  assert.equal(document.__registrations.length, 1);

  bridge.cleanupInitialRenderHostOutput(handoff);
  bridge.revertCreateRootSideEffects(sideEffects);
});

test("private root host-output click canary records listener error routing without reporting globally", () => {
  const document = createHostOutputDocument("root-output-listener-error");
  const container = document.createElement("div");
  const thrown = new Error("private root-output listener boom");
  const calls = [];
  const element = {
    props: {
      children: "error target",
      onClick(event) {
        calls.push({
          event,
          phase: "bubble"
        });
        return "bubble-after-error";
      },
      onClickCapture(event) {
        calls.push({
          event,
          phase: "capture"
        });
        throw thrown;
      }
    },
    type: "button"
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: "event-error-admission",
    initialHostOutputIdPrefix: "event-error-output",
    sideEffectIdPrefix: "event-error-side-effect"
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const render = bridge.renderContainer(create.handle, element);
  const admission = bridge.admitCreateRenderPath(
    create,
    sideEffects,
    render
  );
  const handoff = bridge.applyInitialRenderHostOutput(admission);
  const hostOutputPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(handoff);

  const clickRecord =
    rootListeners.invokePrivateRootHostOutputClickDispatchCanary(
      sideEffects.listenerRegistration,
      hostOutputPayload,
      {
        enableListenerErrorRoutingDiagnostics: true
      }
    );

  assert.equal(clickRecord.publicDispatchEnabled, false);
  assert.equal(clickRecord.syntheticEventCount, 0);
  assert.equal(clickRecord.listenerInvocationCount, 2);
  assert.equal(clickRecord.captureListenerInvocationCount, 1);
  assert.equal(clickRecord.bubbleListenerInvocationCount, 1);
  assert.equal(clickRecord.listenerErrorCount, 1);
  assert.equal(clickRecord.listenerErrorRouteCount, 1);
  assert.equal(clickRecord.listenerErrorRoutingDiagnosticEnabled, true);
  assert.equal(
    clickRecord.listenerErrorRoutingStatus,
    pluginEventSystem.PRIVATE_LISTENER_ERROR_ROUTING_DIAGNOSTIC_STATUS
  );
  assert.deepEqual(
    calls.map((call) => call.phase),
    ["capture", "bubble"]
  );
  for (const call of calls) {
    assert.equal(call.event.syntheticEvent, false);
    assert.equal(Object.hasOwn(call.event, "stopPropagation"), false);
  }

  const [errorRoute] = clickRecord.listenerErrorRoutes;
  assert.equal(
    errorRoute.kind,
    pluginEventSystem.DISPATCH_LISTENER_ERROR_ROUTE_RECORD_KIND
  );
  assert.equal(
    pluginEventSystem.isDispatchListenerErrorRouteRecord(errorRoute),
    true
  );
  assert.equal(errorRoute.errorRouteTarget, "reportGlobalError");
  assert.equal(errorRoute.errorReported, false);
  assert.equal(errorRoute.exposesError, false);
  assert.equal(Object.hasOwn(errorRoute, "error"), false);
  assert.equal(errorRoute.phase, "capture");
  assert.equal(errorRoute.registrationName, "onClickCapture");
  assert.equal(errorRoute.targetInst, hostOutputPayload.hostToken);
  assert.equal(
    errorRoute.blockedReason,
    pluginEventSystem.LISTENER_ERROR_ROUTING_BLOCKED_CODE
  );
  assert.equal(
    pluginEventSystem.getDispatchListenerErrorRouteRecordPayload(
      errorRoute
    ).error,
    thrown
  );

  const clickPayload =
    rootListeners.getPrivateRootHostOutputClickDispatchCanaryPayload(
      clickRecord
    );
  assert.deepEqual(
    clickPayload.invocationRecords.map((record) => [
      record.phase,
      record.listenerErrorCaptured,
      record.listenerReturnStatus
    ]),
    [
      ["capture", true, "not-applicable"],
      ["bubble", false, "string"]
    ]
  );
  assert.equal(
    clickPayload.queueInvocationRecord.listenerErrorRouteCount,
    1
  );
  assert.equal(clickPayload.nativeEvent.stopPropagationCallCount, 0);
  assert.equal(hostOutputPayload.hostNode.__registrations.length, 0);
  assert.equal(container.__registrations.length, 138);
  assert.equal(document.__registrations.length, 1);

  bridge.cleanupInitialRenderHostOutput(handoff);
  bridge.revertCreateRootSideEffects(sideEffects);
});

test("private dispatch queue propagation stop preserves same-target listener queues and skips ancestors", () => {
  const root = createEventTarget("same-target-stop-root");
  const parent = createNode("DIV", domContainer.ELEMENT_NODE, root);
  const child = createNode("BUTTON", domContainer.ELEMENT_NODE, parent);
  const rootOwner = {kind: "SameTargetStopRootOwner"};
  const parentHostOwner = {kind: "SameTargetStopParentHostOwner"};
  const childHostOwner = {kind: "SameTargetStopChildHostOwner"};
  const calls = [];
  const parentToken = componentTree.createHostInstanceToken(
    parentHostOwner,
    rootOwner
  );
  const childToken = componentTree.createHostInstanceToken(
    childHostOwner,
    rootOwner
  );
  componentTree.attachHostInstanceNode(parent, parentToken, {});
  componentTree.attachHostInstanceNode(child, childToken, {});
  const childFirstQueue =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      child,
      "click",
      false,
      event => {
        event.stopPropagation();
        calls.push({
          currentTarget: event.currentTarget,
          event,
          name: "child-first",
          stoppedAfter: event.isPropagationStopped(),
          targetInst: event.targetInst
        });
      }
    );
  const childSecondQueue =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      child,
      "click",
      false,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          event,
          name: "child-second",
          stoppedBefore: event.isPropagationStopped(),
          targetInst: event.targetInst
        });
      }
    );
  const parentQueue =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      parent,
      "click",
      false,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          event,
          name: "parent",
          targetInst: event.targetInst
        });
      }
    );
  const wrapperRecord = eventListener.createEventListenerWrapperRecordWithPriority(
    root,
    "click",
    0
  );
  const nativeEvent = createNativeEvent("click", child);
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      wrapperRecord,
      nativeEvent
    );

  assert.equal(dispatchRecord.targetListenerFound, false);
  assert.equal(dispatchRecord.dispatchQueue.listenerCount, 3);
  assert.deepEqual(
    dispatchRecord.dispatchQueue.entries[0].listeners.map((record) => [
      record.listenerType,
      record.listenerQueueIndex,
      record.currentTarget
    ]),
    [
      ["private-event-listener-queue", 0, child],
      ["private-event-listener-queue", 1, child],
      ["private-event-listener-queue", 0, parent]
    ]
  );

  const queueRecord =
    pluginEventSystem.invokeDispatchQueueCanaryFromDispatchRecords(
      dispatchRecord,
      {
        enablePropagationStopDiagnostics: true
      }
    );

  assert.equal(queueRecord.publicDispatchEnabled, false);
  assert.equal(queueRecord.syntheticEventCount, 0);
  assert.equal(queueRecord.listenerCandidateCount, 3);
  assert.equal(queueRecord.listenerInvocationCount, 2);
  assert.equal(queueRecord.propagationStopCallCount, 1);
  assert.equal(queueRecord.propagationStopNativeCallCount, 1);
  assert.equal(queueRecord.propagationSkippedListenerCount, 1);
  assert.equal(
    queueRecord.nativeStopImmediatePropagationSkippedListenerCount,
    0
  );
  assert.equal(
    queueRecord.nativeStopImmediatePropagationDiagnosticStatus,
    "not-applicable"
  );
  assert.deepEqual(
    queueRecord.invocationOrder.map((entry) => [
      entry.currentTarget,
      entry.invocationStatus,
      entry.skippedByPropagationStop,
      entry.skippedByNativeStopImmediatePropagation,
      entry.targetInst
    ]),
    [
      [child, "invoked-single-listener", false, false, childToken],
      [child, "invoked-single-listener", false, false, childToken],
      [parent, "skipped-propagation-stopped", true, false, parentToken]
    ]
  );
  assert.deepEqual(
    queueRecord.propagationStopDiagnostics.map((record) => [
      record.action,
      record.listenerQueueRelationToStopSource,
      record.sameTargetAsStopSource,
      record.propagationSkippedListener,
      record.targetInst
    ]),
    [
      ["stop-propagation", "same-target", true, false, childToken],
      ["skip-listener", "ancestor", false, true, parentToken]
    ]
  );
  assert.deepEqual(
    calls.map((call) => [
      call.name,
      call.currentTarget,
      call.targetInst,
      call.stoppedAfter ?? call.stoppedBefore
    ]),
    [
      ["child-first", child, childToken, true],
      ["child-second", child, childToken, true]
    ]
  );
  assert.equal(Object.hasOwn(calls[0].event, "nativeEvent"), false);
  assert.equal(typeof calls[0].event.stopPropagation, "function");
  assert.equal(typeof calls[0].event.isPropagationStopped, "function");
  assert.equal(nativeEvent.stopPropagationCallCount, 1);
  assert.equal(nativeEvent.stopImmediatePropagationCallCount, 0);

  listenerRegistry.removePrivateEventListenerQueueEntry(parentQueue);
  listenerRegistry.removePrivateEventListenerQueueEntry(childSecondQueue);
  listenerRegistry.removePrivateEventListenerQueueEntry(childFirstQueue);
  assert.equal(componentTree.detachHostInstanceToken(childToken), childToken);
  assert.equal(componentTree.detachHostInstanceToken(parentToken), parentToken);
});

test("private dispatch queue native stopImmediatePropagation diagnostics skip same-target and ancestor queues", () => {
  const root = createEventTarget("native-stop-immediate-root");
  const parent = createNode("DIV", domContainer.ELEMENT_NODE, root);
  const child = createNode("BUTTON", domContainer.ELEMENT_NODE, parent);
  const rootOwner = {kind: "NativeStopImmediateRootOwner"};
  const parentHostOwner = {kind: "NativeStopImmediateParentHostOwner"};
  const childHostOwner = {kind: "NativeStopImmediateChildHostOwner"};
  const calls = [];
  const parentToken = componentTree.createHostInstanceToken(
    parentHostOwner,
    rootOwner
  );
  const childToken = componentTree.createHostInstanceToken(
    childHostOwner,
    rootOwner
  );
  componentTree.attachHostInstanceNode(parent, parentToken, {});
  componentTree.attachHostInstanceNode(child, childToken, {});
  const childFirstQueue =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      child,
      "click",
      false,
      event => {
        event.stopPropagation();
        const stoppedBefore =
          event.isNativeImmediatePropagationStopped();
        event.nativeEvent.stopImmediatePropagation();
        calls.push({
          currentTarget: event.currentTarget,
          event,
          name: "child-first",
          nativeEvent: event.nativeEvent,
          stoppedAfter:
            event.isNativeImmediatePropagationStopped(),
          stoppedBefore,
          targetInst: event.targetInst
        });
      }
    );
  const childSecondQueue =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      child,
      "click",
      false,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          event,
          name: "child-second",
          targetInst: event.targetInst
        });
      }
    );
  const parentQueue =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      parent,
      "click",
      false,
      event => {
        calls.push({
          currentTarget: event.currentTarget,
          event,
          name: "parent",
          targetInst: event.targetInst
        });
      }
    );
  const wrapperRecord = eventListener.createEventListenerWrapperRecordWithPriority(
    root,
    "click",
    0
  );
  const nativeEvent = createNativeEvent("click", child);
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      wrapperRecord,
      nativeEvent
    );

  const queueRecord =
    pluginEventSystem.invokeDispatchQueueCanaryFromDispatchRecords(
      dispatchRecord,
      {
        enableNativeStopImmediatePropagationDiagnostics: true,
        enablePropagationStopDiagnostics: true
      }
    );

  assert.equal(queueRecord.publicDispatchEnabled, false);
  assert.equal(queueRecord.syntheticEventCount, 0);
  assert.equal(queueRecord.listenerCandidateCount, 3);
  assert.equal(queueRecord.listenerInvocationCount, 1);
  assert.equal(queueRecord.propagationStopped, true);
  assert.equal(queueRecord.propagationStopCallCount, 1);
  assert.equal(queueRecord.propagationStopNativeCallCount, 1);
  assert.equal(queueRecord.propagationSkippedListenerCount, 0);
  assert.equal(queueRecord.nativeImmediatePropagationStopped, true);
  assert.equal(queueRecord.nativeStopImmediatePropagationCallCount, 1);
  assert.equal(
    queueRecord.nativeStopImmediatePropagationNativeCallCount,
    1
  );
  assert.equal(
    queueRecord.nativeStopImmediatePropagationSkippedListenerCount,
    2
  );
  assert.equal(
    queueRecord.nativeStopImmediatePropagationDiagnosticStatus,
    pluginEventSystem.PRIVATE_NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_STATUS
  );
  assert.deepEqual(
    queueRecord.invocationOrder.map((entry) => [
      entry.currentTarget,
      entry.invocationStatus,
      entry.skippedByPropagationStop,
      entry.skippedByNativeStopImmediatePropagation,
      entry.targetInst
    ]),
    [
      [child, "invoked-single-listener", false, false, childToken],
      [
        child,
        "skipped-native-stop-immediate-propagation",
        false,
        true,
        childToken
      ],
      [
        parent,
        "skipped-native-stop-immediate-propagation",
        false,
        true,
        parentToken
      ]
    ]
  );
  assert.deepEqual(
    queueRecord.nativeStopImmediatePropagationDiagnostics.map((record) => [
      record.kind,
      record.action,
      record.listenerQueueRelationToStopSource,
      record.sameTargetAsStopSource,
      record.nativeStopImmediatePropagationSkippedListener,
      record.targetInst
    ]),
    [
      [
        pluginEventSystem.DISPATCH_NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_RECORD_KIND,
        "native-stop-immediate-propagation",
        "same-target",
        true,
        false,
        childToken
      ],
      [
        pluginEventSystem.DISPATCH_NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_RECORD_KIND,
        "skip-listener",
        "same-target",
        true,
        true,
        childToken
      ],
      [
        pluginEventSystem.DISPATCH_NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_RECORD_KIND,
        "skip-listener",
        "ancestor",
        false,
        true,
        parentToken
      ]
    ]
  );
  assert.deepEqual(
    queueRecord.propagationStopDiagnostics.map((record) => [
      record.action,
      record.listenerQueueRelationToStopSource,
      record.propagationSkippedListener,
      record.targetInst
    ]),
    [["stop-propagation", "same-target", false, childToken]]
  );
  assert.deepEqual(
    calls.map((call) => [
      call.name,
      call.currentTarget,
      call.targetInst,
      call.nativeEvent,
      call.stoppedBefore,
      call.stoppedAfter
    ]),
    [["child-first", child, childToken, nativeEvent, false, true]]
  );
  assert.equal(Object.hasOwn(calls[0].event, "nativeEvent"), true);
  assert.equal(
    typeof calls[0].event.isNativeImmediatePropagationStopped,
    "function"
  );
  assert.equal(nativeEvent.stopPropagationCallCount, 1);
  assert.equal(nativeEvent.stopImmediatePropagationCallCount, 1);
  assert.equal(nativeEvent.immediatePropagationStopped, true);

  const queuePayload =
    pluginEventSystem.getDispatchQueueInvocationCanaryRecordPayload(
      queueRecord
    );
  assert.deepEqual(
    queuePayload.invocationRecords.map((record) => [
      record.invocationStatus,
      record.nativeStopImmediatePropagationDiagnosticEnabled,
      record.nativeStopImmediatePropagationSkipped,
      record.nativeStopImmediatePropagationCallCount,
      record.nativeStopImmediatePropagationCallCountDelta
    ]),
    [
      ["invoked-single-listener", true, false, 1, 1],
      [
        "skipped-native-stop-immediate-propagation",
        true,
        true,
        1,
        0
      ],
      [
        "skipped-native-stop-immediate-propagation",
        true,
        true,
        1,
        0
      ]
    ]
  );

  listenerRegistry.removePrivateEventListenerQueueEntry(parentQueue);
  listenerRegistry.removePrivateEventListenerQueueEntry(childSecondQueue);
  listenerRegistry.removePrivateEventListenerQueueEntry(childFirstQueue);
  assert.equal(componentTree.detachHostInstanceToken(childToken), childToken);
  assert.equal(componentTree.detachHostInstanceToken(parentToken), parentToken);
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
  assert.equal(textDispatch.targetInst, token);
  assert.equal(
    textDispatch.targetInstStatus,
    "resolved-component-tree-host-instance"
  );
  assert.equal(textDispatch.targetResolutionStatus, "resolved");
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
  assert.equal(textDispatch.targetDispatchPathLength, 1);
  assert.equal(textDispatch.dispatchQueue.length, 1);
  assert.equal(textDispatch.dispatchQueue.listenerCount, 1);
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
    "resolved-component-tree-host-instance"
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
  assert.equal(detachedDispatch.targetInst, null);
  assert.equal(detachedDispatch.targetResolutionStatus, "blocked");
  assert.equal(detachedDispatch.targetDispatchPathLength, 0);
  assert.equal(detachedDispatch.dispatchQueue.length, 0);
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

  assert.throws(
    () => pluginEventSystem.invokeSingleListenerCanaryFromDispatchRecord({}),
    {
      code: pluginEventSystem.INVALID_EVENT_DISPATCH_RECORD_CODE
    }
  );
  assert.throws(
    () => pluginEventSystem.invokeDispatchListenerRecordForCanary({}),
    {
      code: pluginEventSystem.INVALID_DISPATCH_LISTENER_RECORD_CODE
    }
  );
  assert.throws(
    () =>
      pluginEventSystem.createSyntheticEventShapeRecordForDispatchListenerRecord(
        {}
      ),
    {
      code: pluginEventSystem.INVALID_DISPATCH_LISTENER_RECORD_CODE
    }
  );
  assert.throws(
    () => pluginEventSystem.createSyntheticEventShapeGateFromDispatchRecords({}),
    {
      code: pluginEventSystem.INVALID_EVENT_DISPATCH_RECORD_CODE
    }
  );
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
  assert.equal(
    Object.hasOwn(reactDom, "invokeSingleListenerCanaryFromDispatchRecord"),
    false
  );
  assert.equal(
    Object.hasOwn(reactDomClient, "invokeLastRootListenerSingleListenerCanary"),
    false
  );
  assert.equal(
    Object.hasOwn(
      reactDomClient,
      "createPrivateRootHostOutputClickSyntheticEventShapeGate"
    ),
    false
  );
  assert.equal(
    Object.hasOwn(reactDomClient, "registerPrivateEventListenerQueueEntry"),
    false
  );

  const exportedSubpaths = Object.keys(reactDomPackageJson.exports);
  for (const subpath of [
    "./src/events/dispatch",
    "./src/events/event-system-flags",
    "./src/events/get-event-target",
    "./src/events/listener-registry",
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
    immediatePropagationStopped: false,
    preventDefaultCallCount: 0,
    stopImmediatePropagationCallCount: 0,
    stopPropagationCallCount: 0,
    target,
    type,
    preventDefault() {
      this.preventDefaultCallCount++;
    },
    stopPropagation() {
      this.stopPropagationCallCount++;
    },
    stopImmediatePropagation() {
      this.immediatePropagationStopped = true;
      this.stopImmediatePropagationCallCount++;
    }
  };
}

function createHostOutputDocument(label) {
  const document = createHostOutputTarget({
    label,
    nodeName: "#document",
    nodeType: domContainer.DOCUMENT_NODE
  });
  document.ownerDocument = document;
  document.defaultView = createHostOutputTarget({
    label: `${label}-window`
  });
  document.createElement = function createElementForHostOutput(tagName) {
    return createHostOutputTarget({
      nodeName: String(tagName).toUpperCase(),
      nodeType: domContainer.ELEMENT_NODE,
      ownerDocument: document
    });
  };
  document.createTextNode = function createTextForHostOutput(text) {
    const node = createHostOutputTarget({
      nodeName: "#text",
      nodeType: domContainer.TEXT_NODE,
      ownerDocument: document
    });
    let textValue = String(text);
    node.writeLog = [];
    Object.defineProperties(node, {
      data: {
        configurable: true,
        enumerable: true,
        get() {
          return textValue;
        },
        set(value) {
          textValue = String(value);
          this.writeLog.push(["data", textValue]);
        }
      },
      nodeValue: {
        configurable: true,
        enumerable: true,
        get() {
          return textValue;
        },
        set(value) {
          textValue = String(value);
          this.writeLog.push(["nodeValue", textValue]);
        }
      },
      textContent: {
        configurable: true,
        enumerable: true,
        get() {
          return textValue;
        },
        set(value) {
          textValue = String(value);
          this.writeLog.push(["textContent", textValue]);
        }
      }
    });
    return node;
  };
  return document;
}

function createHostOutputTarget(fields) {
  const target = {
    ...fields,
    __registrations: [],
    __removals: [],
    attributeLog: [],
    attributes: new Map(),
    childNodes: [],
    mutationLog: [],
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
      this.__removals.push({
        listener,
        options,
        type
      });
    },
    appendChild(child) {
      detachHostOutputTarget(child);
      this.childNodes.push(child);
      child.parentNode = this;
      this.mutationLog.push(["appendChild", child.nodeName]);
      return child;
    },
    insertBefore(child, beforeChild) {
      if (beforeChild.parentNode !== this) {
        throw new Error("Cannot insert before a child from another parent.");
      }
      detachHostOutputTarget(child);
      const index = this.childNodes.indexOf(beforeChild);
      this.childNodes.splice(index, 0, child);
      child.parentNode = this;
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
      detachHostOutputTarget(child);
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
      this.attributeLog.push([
        "removeAttribute",
        attributeName,
        hadAttribute
      ]);
    }
  };
  let textContent = "";
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
    },
    textContent: {
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
          detachHostOutputTarget(child);
        }
        textContent = String(value);
        this.mutationLog.push(["textContent", textContent]);
      }
    }
  });
  return target;
}

function detachHostOutputTarget(child) {
  if (child == null || typeof child !== "object") {
    throw new Error("Expected a fake-DOM child object.");
  }
  if (child.parentNode === null || child.parentNode === undefined) {
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
