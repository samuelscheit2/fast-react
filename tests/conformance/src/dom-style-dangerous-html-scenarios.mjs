const text = (value) => ({ type: "string", value });
const number = (value) => ({ type: "number", value });
const nanValue = () => ({ type: "number", value: "NaN", nonFinite: true });
const infinityValue = () => ({
  type: "number",
  value: "Infinity",
  nonFinite: true
});
const nullValue = () => ({ type: "null" });
const undefinedValue = () => ({ type: "undefined" });
const objectValue = (entries) => ({ type: "object", entries });

export const DOM_STYLE_DANGEROUS_HTML_SCENARIOS = [
  {
    id: "style-serialization-numeric-units-and-custom-properties",
    description:
      "Style object serialization for normal CSS properties, numeric unit behavior, vendor prefixes, and CSS custom properties.",
    coverage: [
      "style-serialization",
      "numeric-unit-behavior",
      "unitless-numeric-styles",
      "css-custom-properties",
      "vendor-prefixed-styles"
    ],
    elementType: "div",
    phases: [
      {
        id: "initial",
        props: [
          [
            "style",
            objectValue([
              ["color", text("red")],
              ["marginTop", number(4)],
              ["opacity", number(0.5)],
              ["flex", number(1)],
              ["lineHeight", number(1.2)],
              ["zIndex", number(2)],
              ["WebkitLineClamp", number(2)],
              ["msTransition", text("all 1s")],
              ["--gap", text("4px")],
              ["--count", number(3)],
              ["backgroundImage", text('url("x&y")')]
            ])
          ],
          ["children", text("Styled")]
        ]
      }
    ]
  },
  {
    id: "style-update-and-removal",
    description:
      "A two-phase update that mutates retained style values and clears removed normal and custom CSS properties.",
    coverage: [
      "style-update-behavior",
      "style-removal",
      "numeric-unit-behavior",
      "css-custom-properties"
    ],
    elementType: "div",
    phases: [
      {
        id: "initial",
        props: [
          [
            "style",
            objectValue([
              ["color", text("red")],
              ["marginTop", number(4)],
              ["opacity", number(0.5)],
              ["flex", number(1)],
              ["--gap", text("4px")],
              ["--count", number(3)],
              ["backgroundColor", text("yellow")],
              ["borderWidth", number(2)],
              ["paddingLeft", text("1em")]
            ])
          ],
          ["children", text("Styled before")]
        ]
      },
      {
        id: "update",
        props: [
          [
            "style",
            objectValue([
              ["color", nullValue()],
              ["marginTop", number(0)],
              ["opacity", nullValue()],
              ["--gap", nullValue()],
              ["backgroundColor", text("blue")]
            ])
          ],
          ["children", text("Styled after")]
        ]
      }
    ]
  },
  {
    id: "invalid-style-development-warnings",
    description:
      "Development diagnostics for invalid numeric style values and hyphenated style names.",
    coverage: [
      "invalid-style-warnings",
      "numeric-unit-behavior",
      "vendor-prefixed-styles"
    ],
    elementType: "div",
    phases: [
      {
        id: "initial",
        props: [
          [
            "style",
            objectValue([
              ["width", nanValue()],
              ["height", infinityValue()],
              ["background-color", text("red")],
              ["msTransition", text("all 1s")],
              ["WebkitLineClamp", number(2)]
            ])
          ],
          ["children", text("Invalid styles")]
        ]
      }
    ]
  },
  {
    id: "style-prop-shape-validation",
    description:
      "React DOM rejects a string style prop instead of treating it as a raw CSS declaration.",
    coverage: ["style-shape-validation", "invalid-style-warnings"],
    elementType: "div",
    phases: [
      {
        id: "initial",
        props: [
          ["style", text("color:red")],
          ["children", text("Bad style")]
        ]
      }
    ]
  },
  {
    id: "dangerously-set-inner-html-serialization",
    description:
      "Server and client output for a valid dangerouslySetInnerHTML payload.",
    coverage: ["dangerously-set-inner-html-serialization"],
    elementType: "div",
    phases: [
      {
        id: "initial",
        props: [
          [
            "dangerouslySetInnerHTML",
            objectValue([
              ["__html", text('<span data-x="1">Raw &amp; safe</span>')]
            ])
          ]
        ]
      }
    ]
  },
  {
    id: "dangerously-set-inner-html-null-html",
    description:
      "A null __html payload is accepted and produces an empty host element.",
    coverage: [
      "dangerously-set-inner-html-serialization",
      "inner-html-shape-validation"
    ],
    elementType: "div",
    phases: [
      {
        id: "initial",
        props: [
          [
            "dangerouslySetInnerHTML",
            objectValue([["__html", nullValue()]])
          ]
        ]
      }
    ]
  },
  {
    id: "dangerously-set-inner-html-update-and-removal",
    description:
      "Client updates replace assigned innerHTML and then switch back to managed children.",
    coverage: [
      "dangerously-set-inner-html-update-behavior",
      "dangerously-set-inner-html-removal",
      "update-behavior"
    ],
    elementType: "div",
    phases: [
      {
        id: "initial",
        props: [
          [
            "dangerouslySetInnerHTML",
            objectValue([["__html", text("<span>Before</span>")]])
          ]
        ]
      },
      {
        id: "update",
        props: [
          [
            "dangerouslySetInnerHTML",
            objectValue([["__html", text("<em>After</em>")]])
          ]
        ]
      },
      {
        id: "remove",
        props: [
          ["dangerouslySetInnerHTML", undefinedValue()],
          ["children", text("Managed child")]
        ]
      }
    ]
  },
  {
    id: "dangerously-set-inner-html-shape-validation-string",
    description:
      "React DOM rejects a non-object dangerouslySetInnerHTML prop.",
    coverage: ["inner-html-shape-validation"],
    elementType: "div",
    phases: [
      {
        id: "initial",
        props: [["dangerouslySetInnerHTML", text("<strong>bad</strong>")]]
      }
    ]
  },
  {
    id: "dangerously-set-inner-html-shape-validation-missing-html",
    description:
      "React DOM rejects an object without a __html key as dangerouslySetInnerHTML.",
    coverage: ["inner-html-shape-validation"],
    elementType: "div",
    phases: [
      {
        id: "initial",
        props: [
          [
            "dangerouslySetInnerHTML",
            objectValue([["html", text("<strong>bad</strong>")]])
          ]
        ]
      }
    ]
  },
  {
    id: "dangerously-set-inner-html-children-conflict",
    description:
      "React DOM rejects host props that provide both children and dangerouslySetInnerHTML.",
    coverage: ["inner-html-shape-validation", "children-conflict-validation"],
    elementType: "div",
    phases: [
      {
        id: "initial",
        props: [
          [
            "dangerouslySetInnerHTML",
            objectValue([["__html", text("<strong>bad</strong>")]])
          ],
          ["children", text("conflict")]
        ]
      }
    ]
  }
];
