export const REACT_DOM_ROOT_RENDER_E2E_SCENARIOS = [
  {
    id: "create-root-no-render",
    area: "Root creation",
    description:
      "createRoot returns a root object, marks/listens to the container, and does not mutate container children before render."
  },
  {
    id: "initial-host-render",
    area: "Initial render",
    description:
      "flushSync(() => root.render(host element with text)) commits a host tree synchronously and returns undefined."
  },
  {
    id: "update-host-render",
    area: "Update render",
    description:
      "A second root.render updates the same host child props and text through DOM mutations under the same root."
  },
  {
    id: "replace-host-tree",
    area: "Replacement render",
    description:
      "A later root.render replaces the root child type, removing old host output and placing new host output."
  },
  {
    id: "render-null-clears-container",
    area: "Render null",
    description:
      "root.render(null) clears mounted children while keeping the root marker alive because the root is still mounted."
  },
  {
    id: "root-unmount",
    area: "Unmount",
    description:
      "root.unmount returns undefined, clears root-owned children, nulls the public internal root slot, and clears the container marker."
  },
  {
    id: "double-unmount",
    area: "Unmount",
    description:
      "A second root.unmount returns undefined and performs no additional root-owned child mutation."
  },
  {
    id: "render-after-unmount",
    area: "Unmount error",
    description:
      "root.render after root.unmount throws the React DOM unmounted-root error."
  },
  {
    id: "flush-sync-cross-root-render",
    area: "flushSync",
    description:
      "A single flushSync callback rendering two roots commits both roots before flushSync returns."
  },
  {
    id: "development-warning-boundaries",
    area: "Warnings",
    description:
      "Development-only duplicate-root, render second-argument, and unmount callback warnings are captured without widening into unsupported behavior."
  }
];

export const REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS =
  REACT_DOM_ROOT_RENDER_E2E_SCENARIOS.map((scenario) => scenario.id);
