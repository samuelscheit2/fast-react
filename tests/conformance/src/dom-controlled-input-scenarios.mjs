const text = (value) => ({ type: "string", value });
const bool = (value) => ({ type: "boolean", value });
const undefinedValue = () => ({ type: "undefined" });
const arrayValue = (items) => ({ type: "array", items });
const noopFunction = (name) => ({ type: "function", name });
const element = (elementType, props = [], children = []) => ({
  type: "element",
  elementType,
  props,
  children
});

const option = (value, label) =>
  element("option", [["value", text(value)]], [text(label)]);

const basicOptions = [
  option("a", "Alpha"),
  option("b", "Beta"),
  option("c", "Gamma")
];

const onChange = noopFunction("onChange");

export const DOM_CONTROLLED_INPUT_SCENARIOS = [
  {
    id: "input-text-controlled-value-update",
    description:
      "Controlled text input writes value/defaultValue on mount and updates value on a later render.",
    coverage: ["input", "controlled", "value-defaultValue", "update-behavior"],
    phases: [
      {
        id: "initial",
        element: element("input", [
          ["type", text("text")],
          ["value", text("alpha")],
          ["onChange", onChange]
        ])
      },
      {
        id: "update",
        element: element("input", [
          ["type", text("text")],
          ["value", text("beta")],
          ["onChange", onChange]
        ])
      }
    ]
  },
  {
    id: "input-text-default-value-update",
    description:
      "Uncontrolled text input uses defaultValue and receives a later defaultValue update.",
    coverage: ["input", "uncontrolled", "value-defaultValue", "update-behavior"],
    phases: [
      {
        id: "initial",
        element: element("input", [
          ["type", text("text")],
          ["defaultValue", text("alpha")]
        ])
      },
      {
        id: "update",
        element: element("input", [
          ["type", text("text")],
          ["defaultValue", text("beta")]
        ])
      }
    ]
  },
  {
    id: "input-value-default-value-warning",
    description:
      "Text input with both value and defaultValue records React's controlled/uncontrolled warning.",
    coverage: [
      "input",
      "controlled-uncontrolled-warnings",
      "value-defaultValue"
    ],
    phases: [
      {
        id: "initial",
        element: element("input", [
          ["type", text("text")],
          ["value", text("controlled")],
          ["defaultValue", text("fallback")],
          ["onChange", onChange]
        ])
      }
    ]
  },
  {
    id: "input-value-readonly-warning",
    description:
      "Text input with value but no onChange/readOnly/disabled records the read-only controlled field warning.",
    coverage: ["input", "controlled-uncontrolled-warnings", "read-only-warning"],
    phases: [
      {
        id: "initial",
        element: element("input", [
          ["type", text("text")],
          ["value", text("locked")]
        ])
      }
    ]
  },
  {
    id: "input-uncontrolled-to-controlled-warning",
    description:
      "A text input updates from uncontrolled defaultValue to controlled value.",
    coverage: [
      "input",
      "controlled-uncontrolled-warnings",
      "value-defaultValue",
      "update-behavior"
    ],
    phases: [
      {
        id: "initial",
        element: element("input", [
          ["type", text("text")],
          ["defaultValue", text("draft")]
        ])
      },
      {
        id: "update",
        element: element("input", [
          ["type", text("text")],
          ["value", text("committed")],
          ["onChange", onChange]
        ])
      }
    ]
  },
  {
    id: "input-controlled-to-uncontrolled-warning",
    description:
      "A text input updates from controlled value to uncontrolled value props.",
    coverage: [
      "input",
      "controlled-uncontrolled-warnings",
      "value-defaultValue",
      "update-behavior"
    ],
    phases: [
      {
        id: "initial",
        element: element("input", [
          ["type", text("text")],
          ["value", text("committed")],
          ["onChange", onChange]
        ])
      },
      {
        id: "update",
        element: element("input", [
          ["type", text("text")],
          ["value", undefinedValue()]
        ])
      }
    ]
  },
  {
    id: "checkbox-controlled-checked-update",
    description:
      "Controlled checkbox writes checked/defaultChecked on mount and updates checked on a later render.",
    coverage: ["input", "checkbox", "checked-defaultChecked", "update-behavior"],
    phases: [
      {
        id: "initial",
        element: element("input", [
          ["type", text("checkbox")],
          ["checked", bool(true)],
          ["onChange", onChange]
        ])
      },
      {
        id: "update",
        element: element("input", [
          ["type", text("checkbox")],
          ["checked", bool(false)],
          ["onChange", onChange]
        ])
      }
    ]
  },
  {
    id: "checkbox-default-checked-update",
    description:
      "Uncontrolled checkbox uses defaultChecked and receives a later defaultChecked update.",
    coverage: [
      "input",
      "checkbox",
      "checked-defaultChecked",
      "update-behavior"
    ],
    phases: [
      {
        id: "initial",
        element: element("input", [
          ["type", text("checkbox")],
          ["defaultChecked", bool(true)]
        ])
      },
      {
        id: "update",
        element: element("input", [
          ["type", text("checkbox")],
          ["defaultChecked", bool(false)]
        ])
      }
    ]
  },
  {
    id: "checkbox-checked-default-checked-warning",
    description:
      "Checkbox with both checked and defaultChecked records React's controlled/uncontrolled warning.",
    coverage: [
      "input",
      "checkbox",
      "controlled-uncontrolled-warnings",
      "checked-defaultChecked"
    ],
    phases: [
      {
        id: "initial",
        element: element("input", [
          ["type", text("checkbox")],
          ["checked", bool(true)],
          ["defaultChecked", bool(false)],
          ["onChange", onChange]
        ])
      }
    ]
  },
  {
    id: "checkbox-checked-readonly-warning",
    description:
      "Checkbox with checked but no onChange/readOnly/disabled records the read-only controlled field warning.",
    coverage: [
      "input",
      "checkbox",
      "controlled-uncontrolled-warnings",
      "read-only-warning"
    ],
    phases: [
      {
        id: "initial",
        element: element("input", [
          ["type", text("checkbox")],
          ["checked", bool(true)]
        ])
      }
    ]
  },
  {
    id: "checkbox-uncontrolled-to-controlled-warning",
    description:
      "A checkbox updates from uncontrolled defaultChecked to controlled checked.",
    coverage: [
      "input",
      "checkbox",
      "controlled-uncontrolled-warnings",
      "checked-defaultChecked",
      "update-behavior"
    ],
    phases: [
      {
        id: "initial",
        element: element("input", [
          ["type", text("checkbox")],
          ["defaultChecked", bool(false)]
        ])
      },
      {
        id: "update",
        element: element("input", [
          ["type", text("checkbox")],
          ["checked", bool(true)],
          ["onChange", onChange]
        ])
      }
    ]
  },
  {
    id: "checkbox-controlled-to-uncontrolled-warning",
    description:
      "A checkbox updates from controlled checked to uncontrolled checked props.",
    coverage: [
      "input",
      "checkbox",
      "controlled-uncontrolled-warnings",
      "checked-defaultChecked",
      "update-behavior"
    ],
    phases: [
      {
        id: "initial",
        element: element("input", [
          ["type", text("checkbox")],
          ["checked", bool(true)],
          ["onChange", onChange]
        ])
      },
      {
        id: "update",
        element: element("input", [
          ["type", text("checkbox")],
          ["checked", undefinedValue()]
        ])
      }
    ]
  },
  {
    id: "select-single-controlled-update",
    description:
      "Controlled single select applies value to option selected state and updates it.",
    coverage: ["select", "controlled", "select-single", "update-behavior"],
    phases: [
      {
        id: "initial",
        element: element(
          "select",
          [
            ["value", text("b")],
            ["onChange", onChange]
          ],
          basicOptions
        )
      },
      {
        id: "update",
        element: element(
          "select",
          [
            ["value", text("c")],
            ["onChange", onChange]
          ],
          basicOptions
        )
      }
    ]
  },
  {
    id: "select-multiple-controlled-update",
    description:
      "Controlled multiple select applies an array value and updates selected options.",
    coverage: ["select", "controlled", "select-multiple", "update-behavior"],
    phases: [
      {
        id: "initial",
        element: element(
          "select",
          [
            ["multiple", bool(true)],
            ["value", arrayValue([text("b"), text("c")])],
            ["onChange", onChange]
          ],
          basicOptions
        )
      },
      {
        id: "update",
        element: element(
          "select",
          [
            ["multiple", bool(true)],
            ["value", arrayValue([text("a")])],
            ["onChange", onChange]
          ],
          basicOptions
        )
      }
    ]
  },
  {
    id: "select-multiple-default-value",
    description:
      "Uncontrolled multiple select applies defaultValue array to initial selected options.",
    coverage: ["select", "uncontrolled", "select-multiple"],
    phases: [
      {
        id: "initial",
        element: element(
          "select",
          [
            ["multiple", bool(true)],
            ["defaultValue", arrayValue([text("a"), text("c")])]
          ],
          basicOptions
        )
      }
    ]
  },
  {
    id: "select-value-default-value-warning",
    description:
      "Select with both value and defaultValue records React's controlled/uncontrolled warning.",
    coverage: [
      "select",
      "controlled-uncontrolled-warnings",
      "value-defaultValue"
    ],
    phases: [
      {
        id: "initial",
        element: element(
          "select",
          [
            ["value", text("a")],
            ["defaultValue", text("b")],
            ["onChange", onChange]
          ],
          basicOptions
        )
      }
    ]
  },
  {
    id: "select-value-readonly-warning",
    description:
      "Select with value but no onChange/readOnly/disabled records whether React emits a read-only warning.",
    coverage: ["select", "controlled-uncontrolled-warnings", "read-only-warning"],
    phases: [
      {
        id: "initial",
        element: element("select", [["value", text("b")]], basicOptions)
      }
    ]
  },
  {
    id: "select-uncontrolled-to-controlled-update",
    description:
      "A select updates from uncontrolled defaultValue to controlled value.",
    coverage: [
      "select",
      "controlled-uncontrolled-warnings",
      "value-defaultValue",
      "update-behavior"
    ],
    phases: [
      {
        id: "initial",
        element: element("select", [["defaultValue", text("a")]], basicOptions)
      },
      {
        id: "update",
        element: element(
          "select",
          [
            ["value", text("c")],
            ["onChange", onChange]
          ],
          basicOptions
        )
      }
    ]
  },
  {
    id: "textarea-controlled-value-update",
    description:
      "Controlled textarea writes value/defaultValue on mount and updates value on a later render.",
    coverage: [
      "textarea",
      "controlled",
      "value-defaultValue",
      "update-behavior"
    ],
    phases: [
      {
        id: "initial",
        element: element("textarea", [
          ["value", text("alpha")],
          ["onChange", onChange]
        ])
      },
      {
        id: "update",
        element: element("textarea", [
          ["value", text("beta")],
          ["onChange", onChange]
        ])
      }
    ]
  },
  {
    id: "textarea-default-value-update",
    description:
      "Uncontrolled textarea uses defaultValue and receives a later defaultValue update.",
    coverage: [
      "textarea",
      "uncontrolled",
      "value-defaultValue",
      "update-behavior"
    ],
    phases: [
      {
        id: "initial",
        element: element("textarea", [["defaultValue", text("alpha")]])
      },
      {
        id: "update",
        element: element("textarea", [["defaultValue", text("beta")]])
      }
    ]
  },
  {
    id: "textarea-children-warning",
    description:
      "Textarea children are observed separately from defaultValue/value props.",
    coverage: ["textarea", "textarea-children", "controlled-uncontrolled-warnings"],
    phases: [
      {
        id: "initial",
        element: element("textarea", [], [text("child text")])
      }
    ]
  },
  {
    id: "textarea-value-default-value-warning",
    description:
      "Textarea with both value and defaultValue records React's controlled/uncontrolled warning.",
    coverage: [
      "textarea",
      "controlled-uncontrolled-warnings",
      "value-defaultValue"
    ],
    phases: [
      {
        id: "initial",
        element: element("textarea", [
          ["value", text("controlled")],
          ["defaultValue", text("fallback")],
          ["onChange", onChange]
        ])
      }
    ]
  },
  {
    id: "textarea-value-readonly-warning",
    description:
      "Textarea with value but no onChange/readOnly/disabled records the read-only controlled field warning.",
    coverage: [
      "textarea",
      "controlled-uncontrolled-warnings",
      "read-only-warning"
    ],
    phases: [
      {
        id: "initial",
        element: element("textarea", [["value", text("locked")]])
      }
    ]
  },
  {
    id: "textarea-uncontrolled-to-controlled-warning",
    description:
      "A textarea updates from uncontrolled defaultValue to controlled value.",
    coverage: [
      "textarea",
      "controlled-uncontrolled-warnings",
      "value-defaultValue",
      "update-behavior"
    ],
    phases: [
      {
        id: "initial",
        element: element("textarea", [["defaultValue", text("draft")]])
      },
      {
        id: "update",
        element: element("textarea", [
          ["value", text("committed")],
          ["onChange", onChange]
        ])
      }
    ]
  },
  {
    id: "textarea-controlled-to-uncontrolled-warning",
    description:
      "A textarea updates from controlled value to uncontrolled value props.",
    coverage: [
      "textarea",
      "controlled-uncontrolled-warnings",
      "value-defaultValue",
      "update-behavior"
    ],
    phases: [
      {
        id: "initial",
        element: element("textarea", [
          ["value", text("committed")],
          ["onChange", onChange]
        ])
      },
      {
        id: "update",
        element: element("textarea", [["value", undefinedValue()]])
      }
    ]
  }
];
