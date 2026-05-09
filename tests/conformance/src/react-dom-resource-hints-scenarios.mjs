export const REACT_DOM_RESOURCE_HINT_SCENARIOS = [
  {
    id: "resource-hint-export-shape",
    area: "public export shape",
    observationKind: "public",
    reason:
      "Records descriptors and function lengths for the six public React DOM resource hint APIs."
  },
  {
    id: "default-dispatcher-public-calls",
    area: "public no-renderer behavior",
    observationKind: "public",
    reason:
      "Calls valid resource hints with React DOM's default no-op dispatcher to prove return values and absence of warnings without a renderer-installed dispatcher."
  },
  {
    id: "argument-validation-warnings",
    area: "development diagnostics",
    observationKind: "public",
    reason:
      "Exercises invalid and edge arguments so development warning calls can be separated from production's silent normalization behavior."
  },
  {
    id: "private-dispatcher-normalization",
    area: "private dispatcher normalization",
    observationKind: "private-internals",
    reason:
      "Temporarily replaces ReactDOMSharedInternals.d to observe normalized arguments crossing the private resource dispatcher boundary. This is implementation evidence, not a public API claim."
  },
  {
    id: "private-dispatcher-absence",
    area: "private dispatcher absence",
    observationKind: "private-internals",
    reason:
      "Temporarily removes private dispatcher methods to record the thrown shape when internals are corrupted. Public no-renderer behavior is covered by the default dispatcher scenario."
  }
];

export const REACT_DOM_RESOURCE_HINT_SCENARIO_IDS =
  REACT_DOM_RESOURCE_HINT_SCENARIOS.map((scenario) => scenario.id);
