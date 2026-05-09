import { DOM_NAMESPACE_SVG_NAMESPACES } from "./dom-namespace-svg-targets.mjs";

export const DOM_NAMESPACE_SVG_SERVER_SCENARIOS = [
  {
    id: "svg-common-attributes",
    description:
      "Server rendering serializes common React SVG attribute names, xlink attributes, and xml attributes.",
    coverage: [
      "svg-namespace",
      "svg-attribute-aliases",
      "namespaced-attributes",
      "server-markup"
    ]
  },
  {
    id: "foreignobject-html-boundary",
    description:
      "Server rendering preserves SVG foreignObject with HTML descendants and nested SVG descendants.",
    coverage: [
      "svg-to-html-boundary",
      "foreignObject",
      "nested-svg",
      "server-markup"
    ]
  },
  {
    id: "mathml-basic-tree",
    description:
      "Server rendering serializes MathML elements, MathML attributes, and annotation-xml descendants.",
    coverage: ["mathml-namespace", "mathml-attributes", "server-markup"]
  }
];

export const DOM_NAMESPACE_SVG_CLIENT_SCENARIOS = [
  {
    id: "client-svg-common-attributes",
    container: {
      nodeName: "DIV",
      namespaceURI: DOM_NAMESPACE_SVG_NAMESPACES.html
    },
    description:
      "Client rendering applies common SVG attributes through setAttribute and namespaced attributes through setAttributeNS.",
    coverage: [
      "svg-namespace",
      "svg-attribute-aliases",
      "namespaced-attributes",
      "client-host-output"
    ]
  },
  {
    id: "client-html-svg-foreignobject-html-svg",
    container: {
      nodeName: "DIV",
      namespaceURI: DOM_NAMESPACE_SVG_NAMESPACES.html
    },
    description:
      "Client rendering switches from HTML to SVG, back to HTML below foreignObject, then back to SVG for nested svg.",
    coverage: [
      "html-to-svg",
      "foreignObject",
      "svg-to-html-boundary",
      "nested-svg",
      "client-host-output"
    ]
  },
  {
    id: "client-svg-container-child-context",
    container: {
      nodeName: "svg",
      namespaceURI: DOM_NAMESPACE_SVG_NAMESPACES.svg
    },
    description:
      "Client rendering derives child namespace context from an SVG root container.",
    coverage: ["svg-container-context", "foreignObject", "client-host-output"]
  },
  {
    id: "client-mathml-tree",
    container: {
      nodeName: "DIV",
      namespaceURI: DOM_NAMESPACE_SVG_NAMESPACES.html
    },
    description:
      "Client rendering creates MathML roots and descendants in the MathML namespace.",
    coverage: ["mathml-namespace", "mathml-attributes", "client-host-output"]
  }
];

export function buildDomNamespaceSvgScenarioElement(React, scenarioId) {
  switch (scenarioId) {
    case "svg-common-attributes":
    case "client-svg-common-attributes":
      return React.createElement(
        "svg",
        {
          accentHeight: 7,
          alignmentBaseline: "middle",
          className: "icon",
          clipPath: "url(#clip)",
          fillRule: "evenodd",
          focusable: "false",
          strokeWidth: 2,
          tabIndex: 0,
          viewBox: "0 0 10 10",
          xlinkHref: "#symbol",
          xmlLang: "en",
          xmlSpace: "preserve"
        },
        React.createElement("use", {
          href: "#href-target",
          xlinkHref: "#xlink-target"
        })
      );

    case "foreignobject-html-boundary":
    case "client-html-svg-foreignobject-html-svg":
      return React.createElement(
        "svg",
        null,
        React.createElement(
          "foreignObject",
          {
            height: 4,
            width: 3,
            x: 1,
            y: 2
          },
          React.createElement(
            "div",
            {
              className: "inside"
            },
            React.createElement(
              "svg",
              null,
              React.createElement("circle", {
                cx: 5,
                strokeWidth: 2,
                xlinkHref: "#circle"
              })
            )
          )
        )
      );

    case "client-svg-container-child-context":
      return React.createElement(
        "g",
        {
          strokeWidth: 2
        },
        React.createElement("text", null, "label"),
        React.createElement(
          "foreignObject",
          {
            height: 8,
            width: 9
          },
          React.createElement("div", {
            className: "from-svg-container"
          })
        )
      );

    case "mathml-basic-tree":
    case "client-mathml-tree":
      return React.createElement(
        "math",
        {
          display: "block"
        },
        React.createElement(
          "mrow",
          null,
          React.createElement(
            "mi",
            {
              mathvariant: "bold"
            },
            "x"
          ),
          React.createElement(
            "annotation-xml",
            {
              encoding: "application/xhtml+xml"
            },
            React.createElement(
              "div",
              {
                className: "html-looking-child"
              },
              React.createElement("svg", null, React.createElement("circle"))
            )
          )
        )
      );

    default:
      throw new Error(`Unknown dom-namespace-svg scenario: ${scenarioId}`);
  }
}

export function findDomNamespaceSvgServerScenario(scenarioId) {
  const scenario = DOM_NAMESPACE_SVG_SERVER_SCENARIOS.find(
    (candidate) => candidate.id === scenarioId
  );
  if (!scenario) {
    throw new Error(`Unknown dom-namespace-svg server scenario: ${scenarioId}`);
  }
  return scenario;
}

export function findDomNamespaceSvgClientScenario(scenarioId) {
  const scenario = DOM_NAMESPACE_SVG_CLIENT_SCENARIOS.find(
    (candidate) => candidate.id === scenarioId
  );
  if (!scenario) {
    throw new Error(`Unknown dom-namespace-svg client scenario: ${scenarioId}`);
  }
  return scenario;
}
