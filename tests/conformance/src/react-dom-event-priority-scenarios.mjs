export const REACT_DOM_EVENT_PRIORITY_EXPECTED_DISCRETE_EVENTS = [
  "beforetoggle",
  "cancel",
  "click",
  "close",
  "contextmenu",
  "copy",
  "cut",
  "auxclick",
  "dblclick",
  "dragend",
  "dragstart",
  "drop",
  "focusin",
  "focusout",
  "input",
  "invalid",
  "keydown",
  "keypress",
  "keyup",
  "mousedown",
  "mouseup",
  "paste",
  "pause",
  "play",
  "pointercancel",
  "pointerdown",
  "pointerup",
  "ratechange",
  "reset",
  "resize",
  "seeked",
  "submit",
  "toggle",
  "touchcancel",
  "touchend",
  "touchstart",
  "volumechange",
  "change",
  "selectionchange",
  "textInput",
  "compositionstart",
  "compositionend",
  "compositionupdate",
  "beforeblur",
  "afterblur",
  "beforeinput",
  "blur",
  "fullscreenchange",
  "focus",
  "hashchange",
  "popstate",
  "select",
  "selectstart"
];

export const REACT_DOM_EVENT_PRIORITY_EXPECTED_CONTINUOUS_EVENTS = [
  "drag",
  "dragenter",
  "dragexit",
  "dragleave",
  "dragover",
  "mousemove",
  "mouseout",
  "mouseover",
  "pointermove",
  "pointerout",
  "pointerover",
  "scroll",
  "touchmove",
  "wheel",
  "mouseenter",
  "mouseleave",
  "pointerenter",
  "pointerleave"
];

export const REACT_DOM_EVENT_PRIORITY_MESSAGE_PRIORITY_CASES = [
  {
    schedulerPriorityName: "ImmediateSchedulerPriority",
    schedulerPublicConstant: "unstable_ImmediatePriority",
    schedulerValue: 1,
    eventPriorityName: "DiscreteEventPriority"
  },
  {
    schedulerPriorityName: "UserBlockingSchedulerPriority",
    schedulerPublicConstant: "unstable_UserBlockingPriority",
    schedulerValue: 2,
    eventPriorityName: "ContinuousEventPriority"
  },
  {
    schedulerPriorityName: "NormalSchedulerPriority",
    schedulerPublicConstant: "unstable_NormalPriority",
    schedulerValue: 3,
    eventPriorityName: "DefaultEventPriority"
  },
  {
    schedulerPriorityName: "LowSchedulerPriority",
    schedulerPublicConstant: "unstable_LowPriority",
    schedulerValue: 4,
    eventPriorityName: "DefaultEventPriority"
  },
  {
    schedulerPriorityName: "IdleSchedulerPriority",
    schedulerPublicConstant: "unstable_IdlePriority",
    schedulerValue: 5,
    eventPriorityName: "IdleEventPriority"
  },
  {
    schedulerPriorityName: "UnknownSchedulerPriority",
    schedulerPublicConstant: null,
    schedulerValue: null,
    eventPriorityName: "DefaultEventPriority"
  }
];

export const REACT_DOM_EVENT_PRIORITY_RESOLVE_UPDATE_PRIORITY_CASES = [
  {
    id: "stored-current-update-priority-wins",
    storedPriorityName: "ContinuousEventPriority",
    windowEventType: "click",
    expectedPriorityName: "ContinuousEventPriority",
    reason:
      "resolveUpdatePriority returns ReactDOMSharedInternals.p when it is not NoEventPriority."
  },
  {
    id: "no-current-priority-and-no-window-event-defaults",
    storedPriorityName: "NoEventPriority",
    windowEventType: null,
    expectedPriorityName: "DefaultEventPriority",
    reason:
      "resolveUpdatePriority returns DefaultEventPriority when window.event is undefined."
  },
  {
    id: "window-event-click-maps-discrete",
    storedPriorityName: "NoEventPriority",
    windowEventType: "click",
    expectedPriorityName: "DiscreteEventPriority",
    reason:
      "resolveUpdatePriority maps window.event.type through getEventPriority when no current update priority is set."
  },
  {
    id: "window-event-wheel-maps-continuous",
    storedPriorityName: "NoEventPriority",
    windowEventType: "wheel",
    expectedPriorityName: "ContinuousEventPriority",
    reason:
      "Continuous DOM events are observed through the same getEventPriority fallback."
  },
  {
    id: "window-event-unknown-maps-default",
    storedPriorityName: "NoEventPriority",
    windowEventType: "unknown-fast-react-probe-event",
    expectedPriorityName: "DefaultEventPriority",
    reason:
      "Event names not handled by ReactDOMEventListener.getEventPriority fall through to DefaultEventPriority."
  }
];

export const REACT_DOM_EVENT_PRIORITY_SCENARIOS = [
  {
    id: "react-dom-event-priority-event-name-table",
    area: "DOM event name to lane-backed event priority mapping",
    sourceFiles: [
      "packages/react-dom-bindings/src/events/ReactDOMEventListener.js",
      "packages/react-dom-bindings/src/events/DOMEventNames.js"
    ],
    captures: [
      "discrete getEventPriority cases",
      "continuous getEventPriority cases",
      "DOMEventName union members that fall through to default",
      "unknown event fallback to default"
    ]
  },
  {
    id: "react-dom-event-priority-message-scheduler-bridge",
    area: "message event Scheduler priority bridge",
    sourceFiles: [
      "packages/react-dom-bindings/src/events/ReactDOMEventListener.js"
    ],
    captures: [
      "Immediate Scheduler priority maps to discrete event priority",
      "UserBlocking Scheduler priority maps to continuous event priority",
      "Normal and Low Scheduler priorities map to default event priority",
      "Idle Scheduler priority maps to idle event priority",
      "unknown Scheduler priority maps to default event priority"
    ]
  },
  {
    id: "react-dom-event-priority-lane-backed-constants",
    area: "ReactEventPriorities lane backing",
    sourceFiles: [
      "packages/react-reconciler/src/ReactEventPriorities.js",
      "packages/react-reconciler/src/ReactFiberLane.js"
    ],
    captures: [
      "NoEventPriority equals NoLane",
      "DiscreteEventPriority equals SyncLane",
      "ContinuousEventPriority equals InputContinuousLane",
      "DefaultEventPriority equals DefaultLane",
      "IdleEventPriority equals IdleLane",
      "eventPriorityToLane returns the lane-backed priority"
    ]
  },
  {
    id: "react-dom-event-priority-resolve-update-priority",
    area: "ReactDOMUpdatePriority resolveUpdatePriority fallback order",
    sourceFiles: [
      "packages/react-dom-bindings/src/client/ReactDOMUpdatePriority.js",
      "packages/react-dom-bindings/src/events/ReactDOMEventListener.js"
    ],
    captures: [
      "stored current update priority wins",
      "undefined window.event returns default priority",
      "window.event.type maps through getEventPriority"
    ]
  },
  {
    id: "react-dom-event-priority-fast-react-placeholder-boundary",
    area: "Current Fast React placeholder comparison boundary",
    sourceFiles: [
      "packages/react-dom/index.js",
      "packages/react-dom/client.js",
      "packages/scheduler/cjs/scheduler.development.js"
    ],
    captures: [
      "React DOM public entrypoints are placeholders",
      "event/update priority internals are not exported by Fast React",
      "scheduler priority constants are readable but priority context functions throw placeholders"
    ]
  }
];

export const REACT_DOM_EVENT_PRIORITY_SCENARIO_IDS =
  REACT_DOM_EVENT_PRIORITY_SCENARIOS.map((scenario) => scenario.id);
