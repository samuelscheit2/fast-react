const text = (value) => ({ type: "string", value });
const number = (value) => ({ type: "number", value });
const bool = (value) => ({ type: "boolean", value });
const nullValue = () => ({ type: "null" });
const undefinedValue = () => ({ type: "undefined" });
const objectValue = (entries) => ({ type: "object", entries });

export const DOM_ATTRIBUTE_PROPERTY_SCENARIOS = [
  {
    id: "common-host-props-and-aliases",
    description:
      "Common host attributes plus React aliases className and htmlFor on a label.",
    coverage: ["common-host-props", "className", "htmlFor"],
    elementType: "label",
    phases: [
      {
        id: "initial",
        props: [
          ["id", text("user-label")],
          ["className", text("primary label")],
          ["htmlFor", text("user-input")],
          ["title", text("User name")],
          ["role", text("presentation")],
          ["tabIndex", number(3)],
          ["dir", text("ltr")],
          ["children", text("Name")]
        ]
      }
    ]
  },
  {
    id: "boolean-and-booleanish-attributes",
    description:
      "Boolean attributes and booleanish string attributes that React maps to DOM attributes.",
    coverage: ["common-host-props", "booleanish-attributes"],
    elementType: "button",
    phases: [
      {
        id: "initial",
        props: [
          ["disabled", bool(true)],
          ["hidden", bool(true)],
          ["contentEditable", bool(true)],
          ["spellCheck", bool(false)],
          ["draggable", bool(true)],
          ["translate", text("no")],
          ["children", text("Save")]
        ]
      }
    ]
  },
  {
    id: "data-and-aria-attributes",
    description:
      "data-* and aria-* attributes with string, number, boolean, and empty values.",
    coverage: ["data-props", "aria-props"],
    elementType: "section",
    phases: [
      {
        id: "initial",
        props: [
          ["data-test-id", text("alpha")],
          ["data-count", number(5)],
          ["data-empty", text("")],
          ["aria-hidden", bool(true)],
          ["aria-label", text("Alpha section")],
          ["aria-current", text("page")],
          ["children", text("Accessible")]
        ]
      }
    ]
  },
  {
    id: "custom-and-unknown-attributes",
    description:
      "Lowercase custom attributes, camel-case unknown props, and invalid aria names on a built-in element.",
    coverage: ["custom-attributes", "unknown-props", "warnings"],
    elementType: "div",
    phases: [
      {
        id: "initial",
        props: [
          ["unknownprop", text("lowercase")],
          ["custom-attr", text("dash")],
          ["unknownProp", text("camel")],
          ["customAttr", text("camel-custom")],
          ["aria-labl", text("typo")],
          ["children", text("Unknown")]
        ]
      }
    ]
  },
  {
    id: "custom-element-attribute-property-routing",
    description:
      "Custom element host props, including existing DOM properties and dash-cased attributes.",
    coverage: ["custom-attributes", "custom-elements", "property-routing"],
    elementType: "x-widget",
    phases: [
      {
        id: "initial",
        props: [
          ["id", text("widget")],
          ["className", text("widget-card")],
          ["foo-bar", text("dash")],
          ["fooBar", text("camel")],
          ["objectProp", objectValue([["answer", number(42)]])],
          ["boolProp", bool(true)],
          ["falseProp", bool(false)],
          ["children", text("Widget")]
        ]
      }
    ]
  },
  {
    id: "attribute-update-and-removal",
    description:
      "A two-phase update that changes, removes, and retains host attributes.",
    coverage: ["removal-behavior", "update-behavior", "data-props", "aria-props"],
    elementType: "button",
    phases: [
      {
        id: "initial",
        props: [
          ["id", text("mutable")],
          ["className", text("alpha")],
          ["disabled", bool(true)],
          ["title", text("first")],
          ["data-state", text("open")],
          ["aria-hidden", bool(true)],
          ["custom-attr", text("initial")],
          ["children", text("First")]
        ]
      },
      {
        id: "update",
        props: [
          ["id", text("mutable")],
          ["className", undefinedValue()],
          ["disabled", bool(false)],
          ["title", text("second")],
          ["data-state", nullValue()],
          ["aria-hidden", bool(false)],
          ["custom-attr", undefinedValue()],
          ["children", text("Second")]
        ]
      }
    ]
  }
];
