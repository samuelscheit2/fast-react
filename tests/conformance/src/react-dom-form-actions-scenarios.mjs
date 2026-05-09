export const REACT_DOM_FORM_ACTIONS_SCENARIOS = [
  {
    id: "root-api-descriptors",
    area: "public-root-api-shape",
    APIs: ["requestFormReset", "useFormState", "useFormStatus"],
    expectedBoundary:
      "Default React DOM exposes form APIs as writable enumerable functions; the react-server condition omits them."
  },
  {
    id: "request-form-reset-invalid-inputs",
    area: "requestFormReset-public-errors",
    APIs: ["requestFormReset"],
    expectedBoundary:
      "Rootless and non-React-owned form-like values all throw the public invalid-form error instead of silently resetting."
  },
  {
    id: "hook-calls-outside-render",
    area: "hook-boundary-errors",
    APIs: ["useFormStatus", "useFormState"],
    expectedBoundary:
      "Calling form hooks outside render throws through the null hook dispatcher; development also emits the invalid-hook diagnostic."
  },
  {
    id: "server-render-use-form-status",
    area: "server-render-return-shape",
    APIs: ["useFormStatus"],
    expectedBoundary:
      "Server rendering exposes the non-pending form status object shape without exercising client form submission."
  },
  {
    id: "server-render-use-form-state",
    area: "server-render-return-shape",
    APIs: ["useFormState"],
    expectedBoundary:
      "Server rendering exposes the action-state tuple shape without dispatching an action."
  },
  {
    id: "server-render-function-form-action-boundary",
    area: "dom-form-dependency-boundary",
    APIs: ["useFormStatus"],
    expectedBoundary:
      "Server rendering a function form action emits React's submit-replay boundary while status remains not pending."
  }
];

export const REACT_DOM_FORM_ACTIONS_SCENARIO_IDS =
  REACT_DOM_FORM_ACTIONS_SCENARIOS.map((scenario) => scenario.id);
