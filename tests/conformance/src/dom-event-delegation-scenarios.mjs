export const DOM_EVENT_DELEGATION_SCENARIOS = [
  {
    id: "click-capture-bubble-order",
    eventName: "click",
    reactProp: "onClick",
    eventInit: {
      bubbles: true,
      cancelable: true,
      button: 0,
      buttons: 1,
      clientX: 14,
      clientY: 28
    },
    configuredHandlers: [
      "parent-capture",
      "child-capture",
      "child-bubble",
      "parent-bubble"
    ],
    expectedBehavior:
      "Parent capture, child capture, child bubble, then parent bubble are invoked from one delegated click dispatch."
  },
  {
    id: "click-stop-propagation-child-bubble",
    eventName: "click",
    reactProp: "onClick",
    eventInit: {
      bubbles: true,
      cancelable: true,
      button: 0,
      buttons: 1
    },
    stopAt: "child-bubble",
    configuredHandlers: [
      "parent-capture",
      "child-capture",
      "child-bubble",
      "parent-bubble"
    ],
    expectedBehavior:
      "Calling stopPropagation in the child bubble listener prevents the parent bubble listener while preserving earlier capture listeners."
  },
  {
    id: "click-prevent-default-child-bubble",
    eventName: "click",
    reactProp: "onClick",
    eventInit: {
      bubbles: true,
      cancelable: true,
      button: 0,
      buttons: 1
    },
    preventDefaultAt: "child-bubble",
    configuredHandlers: ["child-bubble"],
    expectedBehavior:
      "Calling preventDefault in a synthetic click listener updates both synthetic and native default-prevented state."
  },
  {
    id: "click-synthetic-event-shape",
    eventName: "click",
    reactProp: "onClick",
    eventInit: {
      bubbles: true,
      cancelable: true,
      button: 0,
      buttons: 1,
      clientX: 9,
      clientY: 12
    },
    configuredHandlers: ["child-bubble"],
    captureSyntheticShape: true,
    expectedBehavior:
      "A delegated click creates a persistent SyntheticMouseEvent-compatible object with stable target and callback-scoped currentTarget."
  },
  {
    id: "mousemove-continuous-capture-bubble-order",
    eventName: "mousemove",
    reactProp: "onMouseMove",
    eventInit: {
      bubbles: true,
      cancelable: true,
      buttons: 1,
      clientX: 31,
      clientY: 37,
      movementX: 2,
      movementY: 3
    },
    configuredHandlers: [
      "parent-capture",
      "child-capture",
      "child-bubble",
      "parent-bubble"
    ],
    expectedBehavior:
      "A delegated continuous mousemove dispatch uses the same capture and bubble listener ordering as click."
  },
  {
    id: "wheel-continuous-delta-and-passive-registration",
    eventName: "wheel",
    reactProp: "onWheel",
    eventInit: {
      bubbles: true,
      cancelable: true,
      clientX: 4,
      clientY: 5,
      deltaX: 1,
      deltaY: 24,
      deltaZ: 0,
      deltaMode: 0
    },
    configuredHandlers: ["child-bubble"],
    captureSyntheticShape: true,
    expectedBehavior:
      "A delegated wheel dispatch exposes wheel delta fields and pairs with passive root listener installation evidence."
  }
];
