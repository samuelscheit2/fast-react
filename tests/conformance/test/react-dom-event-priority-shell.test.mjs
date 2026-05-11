import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  findReactDomExportObservation,
  readCheckedReactDomExportOracle
} from "../src/react-dom-export-oracle.mjs";
import { readCheckedReactDomEventPriorityOracle } from "../src/react-dom-event-priority-oracle.mjs";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);

const eventPriorities = require(
  path.join(repoRoot, "packages/react-dom/src/events/event-priorities.js")
);
const eventNames = require(
  path.join(repoRoot, "packages/react-dom/src/events/event-names.js")
);
const eventListener = require(
  path.join(repoRoot, "packages/react-dom/src/events/react-dom-event-listener.js")
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

const eventPriorityOracle = readCheckedReactDomEventPriorityOracle();
const exportOracle = readCheckedReactDomExportOracle();

test("private React DOM event priority mapping matches the checked oracle buckets", () => {
  for (const [bucket, entries] of Object.entries(
    eventPriorityOracle.eventPriorityTable.buckets
  )) {
    for (const entry of entries) {
      assert.equal(
        eventPriorities.getEventPriority(entry.eventName),
        entry.priorityValue,
        `${bucket}:${entry.eventName}`
      );
      assert.equal(
        eventPriorities.getEventPriorityName(entry.priorityValue),
        entry.priorityName,
        `${bucket}:${entry.eventName} priority name`
      );
      assert.deepEqual(
        eventPriorities.createEventPriorityRecord(entry.eventName),
        {
          domEventName: entry.eventName,
          eventPriority: entry.priorityValue,
          eventPriorityLabel: bucket,
          eventPriorityLane: entry.priorityValue,
          eventPriorityName: entry.priorityName
        },
        `${bucket}:${entry.eventName} priority record`
      );
    }
  }

  const unknown =
    eventPriorityOracle.eventPriorityTable.specialCases.unknownEventFallback;
  assert.equal(
    eventPriorities.getEventPriority(unknown.eventName),
    unknown.priorityValue
  );
});

test("private message event priority bridge follows Scheduler priority oracle cases", () => {
  for (const entry of eventPriorityOracle.messageSchedulerPriorityMapping) {
    assert.equal(
      eventPriorities.getEventPriority("message", {
        schedulerPriority: entry.schedulerValue
      }),
      entry.eventPriorityValue,
      entry.schedulerPriorityName
    );
    assert.equal(
      eventPriorities.createEventPriorityRecord("message", {
        schedulerPriority: entry.schedulerValue
      }).eventPriorityName,
      entry.eventPriorityName,
      `${entry.schedulerPriorityName} priority record`
    );
  }

  assert.equal(
    eventPriorities.getEventPriority("message"),
    eventPriorities.DefaultEventPriority
  );
});

test("private event listener wrappers select priority entry points but stay inert", () => {
  const target = createEventTarget("wrapper-target");
  const cases = [
    {
      domEventName: "click",
      eventSystemFlags: rootListeners.IS_CAPTURE_PHASE,
      expectedDispatcherName: "dispatchDiscreteEvent",
      expectedPriorityLabel: "discrete",
      expectedPriorityName: "DiscreteEventPriority",
      expectedWrapperKind: eventListener.DISCRETE_EVENT_WRAPPER
    },
    {
      domEventName: "keydown",
      eventSystemFlags: rootListeners.IS_CAPTURE_PHASE,
      expectedDispatcherName: "dispatchDiscreteEvent",
      expectedPriorityLabel: "discrete",
      expectedPriorityName: "DiscreteEventPriority",
      expectedWrapperKind: eventListener.DISCRETE_EVENT_WRAPPER
    },
    {
      domEventName: "focusin",
      eventSystemFlags: 0,
      expectedDispatcherName: "dispatchDiscreteEvent",
      expectedPriorityLabel: "discrete",
      expectedPriorityName: "DiscreteEventPriority",
      expectedWrapperKind: eventListener.DISCRETE_EVENT_WRAPPER
    },
    {
      domEventName: "focusout",
      eventSystemFlags: rootListeners.IS_CAPTURE_PHASE,
      expectedDispatcherName: "dispatchDiscreteEvent",
      expectedPriorityLabel: "discrete",
      expectedPriorityName: "DiscreteEventPriority",
      expectedWrapperKind: eventListener.DISCRETE_EVENT_WRAPPER
    },
    {
      domEventName: "wheel",
      eventSystemFlags: 0,
      expectedDispatcherName: "dispatchContinuousEvent",
      expectedPriorityLabel: "continuous",
      expectedPriorityName: "ContinuousEventPriority",
      expectedWrapperKind: eventListener.CONTINUOUS_EVENT_WRAPPER
    },
    {
      domEventName: "mousemove",
      eventSystemFlags: 0,
      expectedDispatcherName: "dispatchContinuousEvent",
      expectedPriorityLabel: "continuous",
      expectedPriorityName: "ContinuousEventPriority",
      expectedWrapperKind: eventListener.CONTINUOUS_EVENT_WRAPPER
    },
    {
      domEventName: "abort",
      eventSystemFlags: 0,
      expectedDispatcherName: "dispatchEvent",
      expectedPriorityLabel: "default",
      expectedPriorityName: "DefaultEventPriority",
      expectedWrapperKind: eventListener.DEFAULT_EVENT_WRAPPER
    },
    {
      domEventName: "animationend",
      eventSystemFlags: 0,
      expectedDispatcherName: "dispatchEvent",
      expectedPriorityLabel: "default",
      expectedPriorityName: "DefaultEventPriority",
      expectedWrapperKind: eventListener.DEFAULT_EVENT_WRAPPER
    },
    {
      domEventName: "message",
      eventSystemFlags: 0,
      options: {
        schedulerPriority: eventPriorities.IdleSchedulerPriority
      },
      expectedDispatcherName: "dispatchEvent",
      expectedPriorityLabel: "idle",
      expectedPriorityName: "IdleEventPriority",
      expectedWrapperKind: eventListener.DEFAULT_EVENT_WRAPPER
    }
  ];

  for (const testCase of cases) {
    const listener = eventListener.createEventListenerWrapperWithPriority(
      target,
      testCase.domEventName,
      testCase.eventSystemFlags,
      testCase.options
    );

    assert.equal(listener.__FAST_REACT_DOM_EVENT_WRAPPER__, true);
    assert.equal(
      listener.__FAST_REACT_DOM_EVENT_WRAPPER_RECORD__.listener,
      listener
    );
    assert.equal(
      listener.__FAST_REACT_DOM_EVENT_WRAPPER_RECORD__.dispatcherName,
      testCase.expectedDispatcherName
    );
    assert.equal(
      listener.__FAST_REACT_DOM_EVENT_WRAPPER_KIND__,
      testCase.expectedWrapperKind
    );
    assert.equal(
      listener.__FAST_REACT_DOM_EVENT_PRIORITY_LABEL__,
      testCase.expectedPriorityLabel
    );
    assert.equal(
      listener.__FAST_REACT_DOM_EVENT_PRIORITY_NAME__,
      testCase.expectedPriorityName
    );
    assert.equal(
      listener.__FAST_REACT_DOM_EVENT_WRAPPER_RECORD__.eventPriorityLabel,
      testCase.expectedPriorityLabel
    );
    assert.equal(
      listener.__FAST_REACT_DOM_EVENT_WRAPPER_RECORD__.priorityRecord
        .eventPriorityName,
      testCase.expectedPriorityName
    );
    assert.equal(
      listener(createNativeEvent(testCase.domEventName)),
      undefined,
      `${testCase.domEventName} listener remains inert`
    );
  }
});

test("private event listener wrapper records cover supported DOM event names", () => {
  const target = createEventTarget("wrapper-record-target");
  const actualWrapperCounts = createPriorityCountRecord();
  const expectedWrapperCounts = createPriorityCountRecord();

  for (const domEventName of eventNames.allNativeEvents) {
    const eventPriority = eventPriorities.getEventPriority(domEventName);
    const priorityLabel = eventPriorities.getEventPriorityLabel(eventPriority);
    expectedWrapperCounts[priorityLabel]++;

    const record = eventListener.createEventListenerWrapperRecordWithPriority(
      target,
      domEventName,
      rootListeners.IS_CAPTURE_PHASE
    );

    actualWrapperCounts[record.eventPriorityLabel]++;
    assert.equal(Object.isFrozen(record), true, domEventName);
    assert.equal(record.kind, eventListener.EVENT_WRAPPER_RECORD_KIND);
    assert.equal(record.domEventName, domEventName);
    assert.equal(record.eventPriority, eventPriority, domEventName);
    assert.equal(record.eventPriorityLane, eventPriority, domEventName);
    assert.equal(record.priorityRecord.domEventName, domEventName);
    assert.equal(record.priorityRecord.eventPriority, eventPriority);
    assert.equal(record.listener.__FAST_REACT_DOM_EVENT_WRAPPER_RECORD__, record);
    assert.equal(record.targetContainer, target);
    assert.equal(record.listener(createNativeEvent(domEventName)), undefined);
  }

  assert.deepEqual(actualWrapperCounts, expectedWrapperCounts);
  assert.equal(target.__registrations.length, 0);
});

test("root listener shells carry private priority metadata without dispatching", () => {
  const target = createEventTarget("root-listener-target");
  const listener = rootListeners.listenToNativeEvent("click", false, target);
  const focusOutCaptureListener =
    rootListeners.listenToNativeEvent("focusout", true, target);

  assert.equal(listener.__FAST_REACT_DOM_EVENT_SHELL__, true);
  assert.equal(listener.__FAST_REACT_DOM_EVENT_WRAPPER__, true);
  assert.equal(
    listener.__FAST_REACT_DOM_EVENT_SHELL_WRAPPER_RECORD__,
    listener.__FAST_REACT_DOM_EVENT_WRAPPER_RECORD__
  );
  assert.equal(
    listener.__FAST_REACT_DOM_EVENT_PRIORITY_NAME__,
    "DiscreteEventPriority"
  );
  assert.equal(
    listener.__FAST_REACT_DOM_EVENT_WRAPPER_KIND__,
    eventListener.DISCRETE_EVENT_WRAPPER
  );
  assert.equal(listener(createNativeEvent("click")), undefined);
  assert.equal(focusOutCaptureListener.__FAST_REACT_DOM_EVENT_SHELL__, true);
  assert.equal(
    focusOutCaptureListener.__FAST_REACT_DOM_EVENT_NAME__,
    "focusout"
  );
  assert.equal(
    focusOutCaptureListener.__FAST_REACT_DOM_EVENT_FLAGS__,
    rootListeners.IS_CAPTURE_PHASE
  );
  assert.equal(
    focusOutCaptureListener.__FAST_REACT_DOM_EVENT_PRIORITY_NAME__,
    "DiscreteEventPriority"
  );
  assert.equal(
    focusOutCaptureListener.__FAST_REACT_DOM_EVENT_WRAPPER_KIND__,
    eventListener.DISCRETE_EVENT_WRAPPER
  );
  assert.equal(
    focusOutCaptureListener(createNativeEvent("focusout")),
    undefined
  );
  assert.equal(target.__registrations.length, 2);
});

test("root listener installation wires every shell to a priority wrapper record", () => {
  const target = createEventTarget("root-listener-record-target");
  const expectedWrapperCounts = createPriorityCountRecord();
  const actualWrapperCounts = createPriorityCountRecord();

  for (const domEventName of eventNames.allNativeEvents) {
    if (domEventName === "selectionchange") {
      continue;
    }
    const registrationCount = eventNames.isNonDelegatedEvent(domEventName)
      ? 1
      : 2;
    expectedWrapperCounts[
      eventPriorities.getEventPriorityLabel(
        eventPriorities.getEventPriority(domEventName)
      )
    ] += registrationCount;
  }

  rootListeners.listenToAllSupportedEvents(target);
  assert.equal(target.__registrations.length, 138);

  for (const registration of target.__registrations) {
    const { listener, type } = registration;
    const record = listener.__FAST_REACT_DOM_EVENT_SHELL_WRAPPER_RECORD__;

    assert.equal(listener.__FAST_REACT_DOM_EVENT_SHELL__, true, type);
    assert.equal(record, listener.__FAST_REACT_DOM_EVENT_WRAPPER_RECORD__, type);
    assert.equal(record.listener, listener, type);
    assert.equal(record.domEventName, type, type);
    assert.equal(record.targetContainer, target, type);
    assert.equal(
      record.eventPriority,
      eventPriorities.getEventPriority(type),
      type
    );
    actualWrapperCounts[record.eventPriorityLabel]++;
    assert.equal(listener(createNativeEvent(type)), undefined, type);
  }

  assert.deepEqual(actualWrapperCounts, expectedWrapperCounts);
});

test("private event priority modules do not change public React DOM exports", () => {
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
  assert.equal(exportedSubpaths.includes("./src/events/event-priorities"), false);
  assert.equal(
    exportedSubpaths.includes("./src/events/react-dom-event-listener"),
    false
  );
});

function createEventTarget(label) {
  return {
    __registrations: [],
    addEventListener(type, listener, options) {
      this.__registrations.push({
        label,
        listener,
        options,
        type
      });
    }
  };
}

function createNativeEvent(type) {
  return {
    type,
    stopPropagation() {
      throw new Error("inert wrapper should not stop propagation");
    }
  };
}

function createPriorityCountRecord() {
  return {
    continuous: 0,
    default: 0,
    discrete: 0,
    idle: 0
  };
}
