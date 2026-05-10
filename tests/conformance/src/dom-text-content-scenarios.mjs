import { DOM_TEXT_CONTENT_NAMESPACES } from "./dom-text-content-targets.mjs";

const text = (value) => ({ type: "string", value });
const number = (value) => ({ type: "number", value });
const bigint = (value) => ({ type: "bigint", value: String(value) });
const bool = (value) => ({ type: "boolean", value });
const nullValue = () => ({ type: "null" });
const undefinedValue = () => ({ type: "undefined" });
const objectValue = (entries) => ({ type: "object", entries });
const arrayValue = (items) => ({ type: "array", items });
const functionValue = (name = "textContentProbeFunction") => ({
  type: "function",
  name
});
const symbolValue = (description) => ({ type: "symbol", description });
const elementValue = (elementType, props = [], key = null) => ({
  type: "reactElement",
  elementType,
  key,
  props
});

export const DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS = [
  {
    id: "should-set-string-child",
    description: "Primitive string children select the element text-content path.",
    coverage: ["shouldSetTextContent", "primitive-string"],
    hostType: "div",
    props: [["children", text("hello")]],
    expectedReactDomValue: true
  },
  {
    id: "should-set-empty-string-child",
    description:
      "The empty string still selects the element text-content path.",
    coverage: ["shouldSetTextContent", "primitive-string", "empty-text"],
    hostType: "div",
    props: [["children", text("")]],
    expectedReactDomValue: true
  },
  {
    id: "should-set-number-child",
    description: "Number children select the element text-content path.",
    coverage: ["shouldSetTextContent", "primitive-number"],
    hostType: "div",
    props: [["children", number(0)]],
    expectedReactDomValue: true
  },
  {
    id: "should-set-bigint-child",
    description: "BigInt children select the element text-content path.",
    coverage: ["shouldSetTextContent", "primitive-bigint"],
    hostType: "div",
    props: [["children", bigint(9007199254740993n)]],
    expectedReactDomValue: true
  },
  {
    id: "should-set-textarea-special-case",
    description:
      "React DOM's internal predicate treats textarea as text-content even though Fast React keeps controlled form behavior blocked.",
    coverage: ["shouldSetTextContent", "textarea-excluded-local-claim"],
    hostType: "textarea",
    props: [["children", text("text area value")]],
    expectedReactDomValue: true
  },
  {
    id: "should-set-noscript-special-case",
    description:
      "React DOM's internal predicate treats noscript as text-content while Fast React keeps noscript behavior outside the local claim.",
    coverage: ["shouldSetTextContent", "noscript-excluded-local-claim"],
    hostType: "noscript",
    props: [["children", text("fallback")]],
    expectedReactDomValue: true
  },
  {
    id: "should-not-set-nullish-children",
    description: "Null and undefined children do not select text-content.",
    coverage: ["shouldSetTextContent", "nullish-children"],
    hostType: "div",
    props: [["children", nullValue()]],
    expectedReactDomValue: false
  },
  {
    id: "should-not-set-boolean-child",
    description: "Boolean children do not select text-content.",
    coverage: ["shouldSetTextContent", "boolean-child"],
    hostType: "div",
    props: [["children", bool(false)]],
    expectedReactDomValue: false
  },
  {
    id: "should-not-set-array-children",
    description:
      "Arrays of primitive children stay on the managed child reconciliation path.",
    coverage: ["shouldSetTextContent", "array-children"],
    hostType: "div",
    props: [["children", arrayValue([text("a"), text("b")])]],
    expectedReactDomValue: false
  },
  {
    id: "should-not-set-react-element-child",
    description: "React element children do not select text-content.",
    coverage: ["shouldSetTextContent", "element-child"],
    hostType: "div",
    props: [["children", elementValue("span", [["children", text("child")]])]],
    expectedReactDomValue: false
  },
  {
    id: "should-not-set-symbol-child",
    description: "Symbol children do not select text-content.",
    coverage: ["shouldSetTextContent", "invalid-child-types", "symbol-child"],
    hostType: "div",
    props: [["children", symbolValue("text-content-symbol")]],
    expectedReactDomValue: false
  },
  {
    id: "should-not-set-function-child",
    description: "Function children do not select text-content.",
    coverage: ["shouldSetTextContent", "invalid-child-types", "function-child"],
    hostType: "div",
    props: [["children", functionValue()]],
    expectedReactDomValue: false
  },
  {
    id: "should-set-dangerous-html-non-null",
    description:
      "A dangerouslySetInnerHTML object with non-null __html selects a leaf shortcut.",
    coverage: ["shouldSetTextContent", "dangerouslySetInnerHTML"],
    hostType: "div",
    props: [
      [
        "dangerouslySetInnerHTML",
        objectValue([["__html", text("<span>raw</span>")]])
      ]
    ],
    expectedReactDomValue: true
  },
  {
    id: "should-set-dangerous-html-empty-string",
    description:
      "An empty-string __html value is non-null and still selects the leaf shortcut.",
    coverage: ["shouldSetTextContent", "dangerouslySetInnerHTML", "empty-html"],
    hostType: "div",
    props: [
      ["dangerouslySetInnerHTML", objectValue([["__html", text("")]])]
    ],
    expectedReactDomValue: true
  },
  {
    id: "should-not-set-dangerous-html-nullish",
    description:
      "Nullish __html does not select text-content or the raw HTML leaf shortcut.",
    coverage: ["shouldSetTextContent", "dangerouslySetInnerHTML-nullish"],
    hostType: "div",
    props: [
      ["dangerouslySetInnerHTML", objectValue([["__html", nullValue()]])]
    ],
    expectedReactDomValue: false
  },
  {
    id: "should-not-set-dangerous-html-invalid-shape",
    description:
      "A non-object dangerouslySetInnerHTML prop is not accepted by the predicate.",
    coverage: ["shouldSetTextContent", "dangerouslySetInnerHTML-invalid-shape"],
    hostType: "div",
    props: [["dangerouslySetInnerHTML", text("<span>bad</span>")]],
    expectedReactDomValue: false
  },
  {
    id: "should-set-dangerous-html-even-with-conflicting-child",
    description:
      "The predicate sees non-null __html as a leaf shortcut; the prop layer reports the children conflict separately.",
    coverage: [
      "shouldSetTextContent",
      "dangerouslySetInnerHTML",
      "children-conflict"
    ],
    hostType: "div",
    props: [
      [
        "dangerouslySetInnerHTML",
        objectValue([["__html", text("<span>raw</span>")]])
      ],
      ["children", elementValue("span", [["children", text("conflict")]])]
    ],
    expectedReactDomValue: true
  }
];

export const DOM_TEXT_CONTENT_RENDER_SCENARIOS = [
  {
    id: "primitive-text-content-shortcut",
    description:
      "Primitive text children use the element text-content shortcut and update through the text setter boundary.",
    coverage: [
      "element-text-content-shortcut",
      "primitive-string",
      "primitive-number",
      "empty-text",
      "text-clear"
    ],
    container: htmlContainer(),
    phases: [
      {
        id: "initial",
        root: elementValue("div", [["children", text("Alpha")]])
      },
      {
        id: "update",
        root: elementValue("div", [["children", text("Beta")]])
      },
      {
        id: "empty",
        root: elementValue("div", [["children", text("")]])
      },
      {
        id: "number",
        root: elementValue("div", [["children", number(42)]])
      },
      {
        id: "clear",
        root: elementValue("div", [["children", nullValue()]])
      }
    ]
  },
  {
    id: "text-content-to-managed-child-boundary",
    description:
      "Switching between element text-content and managed children records the reset and host child boundaries.",
    coverage: [
      "element-text-content-shortcut",
      "managed-child-boundary",
      "resetTextContent",
      "host-element-child"
    ],
    container: htmlContainer(),
    phases: [
      {
        id: "text",
        root: elementValue("section", [["children", text("Plain text")]])
      },
      {
        id: "managed-child",
        root: elementValue("section", [
          [
            "children",
            elementValue("span", [["children", text("Managed child")]])
          ]
        ])
      },
      {
        id: "text-again",
        root: elementValue("section", [
          ["children", text("Plain text again")]
        ])
      }
    ]
  },
  {
    id: "host-text-sibling-boundaries",
    description:
      "Array text around an element stays on the HostText path and updates text nodes separately from element text-content.",
    coverage: [
      "host-text-creation",
      "host-text-update",
      "host-text-deletion",
      "array-children",
      "sibling-boundary"
    ],
    container: htmlContainer(),
    phases: [
      {
        id: "initial",
        root: elementValue("div", [
          [
            "children",
            arrayValue([
              text("left"),
              elementValue("span", [["children", text("middle")]], "middle"),
              text("right")
            ])
          ]
        ])
      },
      {
        id: "update",
        root: elementValue("div", [
          [
            "children",
            arrayValue([
              text("left!"),
              elementValue("span", [["children", text("middle!")]], "middle"),
              text("right!")
            ])
          ]
        ])
      },
      {
        id: "delete-text-siblings",
        root: elementValue("div", [
          [
            "children",
            arrayValue([
              elementValue("span", [["children", text("middle!")]], "middle")
            ])
          ]
        ])
      }
    ]
  },
  {
    id: "host-text-insertion-before-element",
    description:
      "Adding text before and after an existing element records HostText insertion boundaries.",
    coverage: [
      "host-text-creation",
      "host-text-insertion",
      "insertBefore",
      "array-children"
    ],
    container: htmlContainer(),
    phases: [
      {
        id: "element-only",
        root: elementValue("div", [
          ["children", elementValue("span", [["children", text("anchor")]], "a")]
        ])
      },
      {
        id: "prepend-text",
        root: elementValue("div", [
          [
            "children",
            arrayValue([
              text("head"),
              elementValue("span", [["children", text("anchor")]], "a")
            ])
          ]
        ])
      },
      {
        id: "append-text",
        root: elementValue("div", [
          [
            "children",
            arrayValue([
              elementValue("span", [["children", text("anchor")]], "a"),
              text("tail")
            ])
          ]
        ])
      }
    ]
  },
  {
    id: "namespace-text-content-boundaries",
    description:
      "SVG text-content and foreignObject HTML descendants keep namespace creation separate from text writes.",
    coverage: [
      "namespace-text",
      "svg",
      "foreignObject",
      "element-text-content-shortcut",
      "host-text-update"
    ],
    container: htmlContainer(),
    phases: [
      {
        id: "initial",
        root: elementValue("svg", [
          [
            "children",
            arrayValue([
              elementValue("text", [["children", text("Vector")]], "label"),
              elementValue(
                "foreignObject",
                [
                  [
                    "children",
                    elementValue("div", [["children", text("HTML text")]])
                  ]
                ],
                "foreign"
              )
            ])
          ]
        ])
      },
      {
        id: "update",
        root: elementValue("svg", [
          [
            "children",
            arrayValue([
              elementValue("text", [["children", text("Vector!")]], "label"),
              elementValue(
                "foreignObject",
                [
                  [
                    "children",
                    elementValue("div", [["children", text("HTML text!")]])
                  ]
                ],
                "foreign"
              )
            ])
          ]
        ])
      }
    ]
  },
  {
    id: "svg-container-text-root",
    description:
      "An SVG container supplies SVG child context when the rendered root is a text element.",
    coverage: [
      "namespace-text",
      "svg-container-context",
      "element-text-content-shortcut"
    ],
    container: svgContainer(),
    phases: [
      {
        id: "initial",
        root: elementValue("text", [["children", text("Container text")]])
      },
      {
        id: "update",
        root: elementValue("text", [["children", text("Container text!")]])
      }
    ]
  },
  {
    id: "dangerous-html-exclusion-and-managed-text",
    description:
      "dangerouslySetInnerHTML is a leaf shortcut that excludes HostText creation, then can switch back to managed text.",
    coverage: [
      "dangerouslySetInnerHTML",
      "dangerouslySetInnerHTML-exclusion",
      "managed-text-after-html",
      "innerHTML-boundary"
    ],
    container: htmlContainer(),
    phases: [
      {
        id: "raw-html",
        root: elementValue("div", [
          [
            "dangerouslySetInnerHTML",
            objectValue([["__html", text("<span>Raw</span>")]])
          ]
        ])
      },
      {
        id: "managed-text",
        root: elementValue("div", [["children", text("Managed text")]])
      },
      {
        id: "raw-html-again",
        root: elementValue("div", [
          [
            "dangerouslySetInnerHTML",
            objectValue([["__html", text("<em>Raw again</em>")]])
          ]
        ])
      }
    ]
  },
  {
    id: "dangerous-html-nullish-does-not-shortcut",
    description:
      "Nullish __html values do not install raw HTML and do not count as a text-content shortcut.",
    coverage: [
      "dangerouslySetInnerHTML-nullish",
      "dangerouslySetInnerHTML-exclusion",
      "managed-text-after-html"
    ],
    container: htmlContainer(),
    phases: [
      {
        id: "null-html",
        root: elementValue("div", [
          ["dangerouslySetInnerHTML", objectValue([["__html", nullValue()]])]
        ])
      },
      {
        id: "undefined-html",
        root: elementValue("div", [
          [
            "dangerouslySetInnerHTML",
            objectValue([["__html", undefinedValue()]])
          ]
        ])
      },
      {
        id: "managed-text",
        root: elementValue("div", [["children", text("After nullish html")]])
      }
    ]
  },
  {
    id: "dangerous-html-children-conflict",
    description:
      "Providing children with non-null dangerouslySetInnerHTML reports the React DOM conflict and leaves no managed text child claim.",
    coverage: [
      "dangerouslySetInnerHTML",
      "children-conflict",
      "dangerouslySetInnerHTML-exclusion",
      "root-error"
    ],
    container: htmlContainer(),
    phases: [
      {
        id: "conflict",
        root: elementValue("div", [
          [
            "dangerouslySetInnerHTML",
            objectValue([["__html", text("<span>Raw</span>")]])
          ],
          ["children", text("conflict")]
        ])
      }
    ]
  },
  {
    id: "dangerous-html-shape-validation",
    description:
      "A malformed dangerouslySetInnerHTML object is rejected before any managed text child behavior is claimed.",
    coverage: [
      "dangerouslySetInnerHTML-invalid-shape",
      "dangerouslySetInnerHTML-exclusion",
      "root-error"
    ],
    container: htmlContainer(),
    phases: [
      {
        id: "missing-html-key",
        root: elementValue("div", [
          [
            "dangerouslySetInnerHTML",
            objectValue([["html", text("<span>Raw</span>")]])
          ]
        ])
      }
    ]
  }
];

export const DOM_TEXT_CONTENT_SCENARIO_IDS = [
  ...DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS.map((scenario) => scenario.id),
  ...DOM_TEXT_CONTENT_RENDER_SCENARIOS.map((scenario) => scenario.id)
];

export function findDomTextContentRenderScenario(scenarioId) {
  const scenario = DOM_TEXT_CONTENT_RENDER_SCENARIOS.find(
    (candidate) => candidate.id === scenarioId
  );
  if (!scenario) {
    throw new Error(`Unknown DOM text-content render scenario: ${scenarioId}`);
  }
  return scenario;
}

export function findDomTextContentShouldSetScenario(scenarioId) {
  const scenario = DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS.find(
    (candidate) => candidate.id === scenarioId
  );
  if (!scenario) {
    throw new Error(
      `Unknown DOM text-content shouldSetTextContent scenario: ${scenarioId}`
    );
  }
  return scenario;
}

export function materializeElementDescriptor(React, descriptor) {
  if (!descriptor || descriptor.type !== "reactElement") {
    throw new Error("Root descriptor must be a reactElement descriptor");
  }

  const props = materializeProps(React, descriptor.props);
  return React.createElement(
    descriptor.elementType,
    descriptor.key === null ? props : { ...props, key: descriptor.key }
  );
}

export function materializeProps(React, entries) {
  const props = {};
  for (const [key, valueDescriptor] of entries) {
    props[key] = materializeValue(React, valueDescriptor);
  }
  return props;
}

export function materializeValue(React, descriptor) {
  switch (descriptor.type) {
    case "string":
    case "number":
    case "boolean":
      return descriptor.value;
    case "bigint":
      return BigInt(descriptor.value);
    case "null":
      return null;
    case "undefined":
      return undefined;
    case "symbol":
      return Symbol(descriptor.description ?? undefined);
    case "function": {
      const fn = function textContentProbeFunction() {};
      Object.defineProperty(fn, "name", {
        value: descriptor.name,
        configurable: true
      });
      return fn;
    }
    case "array":
      return descriptor.items.map((item) => materializeValue(React, item));
    case "object":
      return Object.fromEntries(
        descriptor.entries.map(([key, value]) => [
          key,
          materializeValue(React, value)
        ])
      );
    case "reactElement":
      return materializeElementDescriptor(React, descriptor);
    default:
      throw new Error(`Unsupported value descriptor type: ${descriptor.type}`);
  }
}

function htmlContainer() {
  return {
    kind: "element",
    nodeName: "DIV",
    tagName: "div",
    namespaceURI: DOM_TEXT_CONTENT_NAMESPACES.html
  };
}

function svgContainer() {
  return {
    kind: "element",
    nodeName: "SVG",
    tagName: "svg",
    namespaceURI: DOM_TEXT_CONTENT_NAMESPACES.svg
  };
}
