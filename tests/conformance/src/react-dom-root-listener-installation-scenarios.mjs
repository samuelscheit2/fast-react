export const REACT_DOM_ROOT_LISTENER_INSTALLATION_SCENARIOS = [
  {
    id: "create-root-root-container",
    category: "root-listener-registration",
    expectedBehavior:
      "createRoot installs one all-supported-event listener set on the root container and one selectionchange listener on the owner document."
  },
  {
    id: "create-root-same-container-dedupe",
    category: "dedupe",
    expectedBehavior:
      "Calling createRoot twice for the same container does not install duplicate root-container or owner-document listeners."
  },
  {
    id: "hydrate-root-root-container",
    category: "root-listener-registration",
    expectedBehavior:
      "hydrateRoot installs one all-supported-event listener set on the root container and one selectionchange listener on the owner document."
  },
  {
    id: "hydrate-root-same-container-dedupe",
    category: "dedupe",
    expectedBehavior:
      "Calling hydrateRoot twice for the same container does not install duplicate root-container or owner-document listeners."
  },
  {
    id: "create-root-then-hydrate-root-same-container-dedupe",
    category: "dedupe",
    expectedBehavior:
      "Calling hydrateRoot after createRoot on the same container reuses the existing listener set without duplicate registration."
  },
  {
    id: "create-root-same-document-dedupe",
    category: "dedupe",
    expectedBehavior:
      "Two roots in the same owner document each get a root listener set, while owner-document selectionchange remains deduped."
  },
  {
    id: "portal-same-document-listeners",
    category: "portal-listener-registration",
    expectedBehavior:
      "Rendering a portal installs the same all-supported-event listener set on the portal container without duplicating owner-document selectionchange."
  },
  {
    id: "portal-cross-document-listeners",
    category: "portal-listener-registration",
    expectedBehavior:
      "Rendering a portal into a different owner document installs portal-container listeners and selectionchange on that portal owner document."
  }
];

export const REACT_DOM_ROOT_LISTENER_INSTALLATION_SCENARIO_IDS =
  REACT_DOM_ROOT_LISTENER_INSTALLATION_SCENARIOS.map(
    (scenario) => scenario.id
  );
