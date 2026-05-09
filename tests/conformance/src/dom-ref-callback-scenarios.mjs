export const DOM_REF_CALLBACK_SCENARIOS = [
  {
    id: "nested-host-callback-ref-mount-unmount",
    area: "host callback ref ordering",
    entrypoints: ["react", "react-dom", "react-dom/client"],
    captures: [
      "nested host node callback attach order",
      "nested host node callback detach order",
      "synchronous flushSync mount and root unmount"
    ]
  },
  {
    id: "stable-callback-ref-update",
    area: "callback ref updates",
    entrypoints: ["react", "react-dom", "react-dom/client"],
    captures: [
      "stable callback ref is not re-fired for a same-node prop update",
      "stable callback ref detaches on root unmount"
    ]
  },
  {
    id: "callback-ref-identity-update",
    area: "callback ref updates",
    entrypoints: ["react", "react-dom", "react-dom/client"],
    captures: [
      "old callback ref detaches before a new callback ref attaches",
      "same host node identity is reused when only the ref callback changes"
    ]
  },
  {
    id: "host-type-replacement-update",
    area: "host callback ref ordering",
    entrypoints: ["react", "react-dom", "react-dom/client"],
    captures: [
      "same callback ref detaches from a replaced host node",
      "same callback ref attaches to the replacement host node",
      "replacement update ordering is synchronous under flushSync"
    ]
  },
  {
    id: "callback-cleanup-return-update-unmount",
    area: "callback ref cleanup return",
    entrypoints: ["react", "react-dom", "react-dom/client"],
    captures: [
      "callback ref cleanup return is invoked on ref callback replacement",
      "callback ref cleanup return is invoked on unmount",
      "callback ref returning cleanup is not called with null for those cleanups"
    ]
  },
  {
    id: "object-ref-relative-order-and-replacement",
    area: "object refs",
    entrypoints: ["react", "react-dom", "react-dom/client"],
    captures: [
      "object ref current after mount",
      "object ref current after host replacement",
      "object ref current before a sibling callback ref detaches on unmount",
      "object ref current after root unmount"
    ]
  },
  {
    id: "strict-mode-callback-null-detach-cycle",
    area: "StrictMode ref behavior",
    entrypoints: ["react", "react-dom", "react-dom/client"],
    captures: [
      "development StrictMode callback ref null-detach replay",
      "production StrictMode callback ref lifecycle without development replay",
      "root unmount null-detach ordering after StrictMode replay"
    ]
  },
  {
    id: "strict-mode-callback-cleanup-cycle",
    area: "StrictMode ref behavior",
    entrypoints: ["react", "react-dom", "react-dom/client"],
    captures: [
      "development StrictMode callback ref cleanup replay",
      "production StrictMode callback ref lifecycle without development replay",
      "callback cleanup return semantics during StrictMode replay"
    ]
  },
  {
    id: "callback-ref-attach-error-propagation",
    area: "error propagation",
    entrypoints: ["react", "react-dom", "react-dom/client"],
    captures: [
      "callback ref attach errors are reported to createRoot onUncaughtError",
      "failed attach is followed by callback ref detach cleanup"
    ]
  },
  {
    id: "callback-ref-cleanup-error-propagation",
    area: "error propagation",
    entrypoints: ["react", "react-dom", "react-dom/client"],
    captures: [
      "callback ref cleanup return errors are reported to createRoot onUncaughtError",
      "cleanup error propagation does not require asynchronous timing claims"
    ]
  }
];

export const DOM_REF_CALLBACK_SCENARIO_IDS = DOM_REF_CALLBACK_SCENARIOS.map(
  (scenario) => scenario.id
);
