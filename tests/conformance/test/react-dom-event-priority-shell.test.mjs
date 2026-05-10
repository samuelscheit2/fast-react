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
      expectedPriorityName: "DiscreteEventPriority",
      expectedWrapperKind: eventListener.DISCRETE_EVENT_WRAPPER
    },
    {
      domEventName: "wheel",
      eventSystemFlags: 0,
      expectedPriorityName: "ContinuousEventPriority",
      expectedWrapperKind: eventListener.CONTINUOUS_EVENT_WRAPPER
    },
    {
      domEventName: "abort",
      eventSystemFlags: 0,
      expectedPriorityName: "DefaultEventPriority",
      expectedWrapperKind: eventListener.DEFAULT_EVENT_WRAPPER
    },
    {
      domEventName: "message",
      eventSystemFlags: 0,
      options: {
        schedulerPriority: eventPriorities.IdleSchedulerPriority
      },
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
      listener.__FAST_REACT_DOM_EVENT_WRAPPER_KIND__,
      testCase.expectedWrapperKind
    );
    assert.equal(
      listener.__FAST_REACT_DOM_EVENT_PRIORITY_NAME__,
      testCase.expectedPriorityName
    );
    assert.equal(
      listener(createNativeEvent(testCase.domEventName)),
      undefined,
      `${testCase.domEventName} listener remains inert`
    );
  }
});

test("root listener shells carry private priority metadata without dispatching", () => {
  const target = createEventTarget("root-listener-target");
  const listener = rootListeners.listenToNativeEvent("click", false, target);

  assert.equal(listener.__FAST_REACT_DOM_EVENT_SHELL__, true);
  assert.equal(listener.__FAST_REACT_DOM_EVENT_WRAPPER__, true);
  assert.equal(
    listener.__FAST_REACT_DOM_EVENT_PRIORITY_NAME__,
    "DiscreteEventPriority"
  );
  assert.equal(
    listener.__FAST_REACT_DOM_EVENT_WRAPPER_KIND__,
    eventListener.DISCRETE_EVENT_WRAPPER
  );
  assert.equal(listener(createNativeEvent("click")), undefined);
  assert.equal(target.__registrations.length, 1);
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

