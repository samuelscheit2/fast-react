import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);

const propertyPayload = require(
  path.join(
    repoRoot,
    "packages",
    "react-dom",
    "src",
    "dom-host",
    "property-payload.js"
  )
);
const domMutation = require(
  path.join(repoRoot, "packages", "react-dom", "src", "dom-host", "mutation.js")
);
const reactDomPackageJson = require(
  path.join(repoRoot, "packages", "react-dom", "package.json")
);

const {
  CONTROLLED_FORM_PROPERTY_PAYLOAD_STATUS,
  CONTROLLED_VALUE_TRACKER_GATE_STATUS,
  ENTRY_NON_PAYLOAD,
  ENTRY_REMOVE_ATTRIBUTE,
  ENTRY_REMOVE_PROPERTY,
  ENTRY_REMOVE_STYLE,
  ENTRY_SET_ATTRIBUTE,
  ENTRY_SET_INNER_HTML,
  ENTRY_SET_PROPERTY,
  ENTRY_SET_STYLE,
  ENTRY_UNSUPPORTED,
  diffDomPropertyPayload,
  isNonPayloadPropertyPayloadEntry,
  isOrdinaryPropertyPayloadEntry,
  isStyleDangerousHtmlPayloadEntry
} = propertyPayload;
const {
  applyAdmittedDomPropertyPayload,
  applyStyleDangerousHtmlPayload,
  commitDomPropertyUpdate
} = domMutation;

test("private DOM property payload preserves insertion order for ordinary attributes", () => {
  assert.deepEqual(
    diffDomPropertyPayload(
      "label",
      {},
      orderedProps([
        ["id", "user-label"],
        ["className", "primary label"],
        ["htmlFor", "user-input"],
        ["title", "User name"],
        ["role", "presentation"],
        ["tabIndex", 3],
        ["data-test-id", "alpha"],
        ["aria-hidden", false],
        ["custom-attr", "custom"]
      ])
    ),
    [
      setAttribute("id", "id", "user-label"),
      setAttribute("className", "class", "primary label"),
      setAttribute("htmlFor", "for", "user-input"),
      setAttribute("title", "title", "User name"),
      setAttribute("role", "role", "presentation"),
      setAttribute("tabIndex", "tabindex", "3"),
      setAttribute("data-test-id", "data-test-id", "alpha"),
      setAttribute("aria-hidden", "aria-hidden", "false"),
      setAttribute("custom-attr", "custom-attr", "custom")
    ]
  );
});

test("private DOM property payload records updates and explicit removals", () => {
  assert.deepEqual(
    diffDomPropertyPayload(
      "button",
      orderedProps([
        ["id", "mutable"],
        ["className", "alpha"],
        ["disabled", true],
        ["title", "first"],
        ["data-state", "open"],
        ["aria-hidden", true],
        ["custom-attr", "initial"]
      ]),
      orderedProps([
        ["id", "mutable"],
        ["className", undefined],
        ["disabled", false],
        ["title", "second"],
        ["data-state", null],
        ["aria-hidden", false],
        ["custom-attr", undefined]
      ])
    ),
    [
      removeAttribute("className", "class"),
      removeAttribute("disabled", "disabled"),
      setAttribute("title", "title", "second"),
      removeAttribute("data-state", "data-state"),
      setAttribute("aria-hidden", "aria-hidden", "false"),
      removeAttribute("custom-attr", "custom-attr")
    ]
  );
});

test("private DOM property payload records omitted prop removals before new prop updates", () => {
  assert.deepEqual(
    diffDomPropertyPayload(
      "div",
      orderedProps([
        ["title", "old"],
        ["role", "button"],
        ["hidden", true],
        ["data-active", true]
      ]),
      orderedProps([
        ["id", "new"],
        ["aria-current", "page"]
      ])
    ),
    [
      removeAttribute("title", "title"),
      removeAttribute("role", "role"),
      removeAttribute("hidden", "hidden"),
      removeAttribute("data-active", "data-active"),
      setAttribute("id", "id", "new"),
      setAttribute("aria-current", "aria-current", "page")
    ]
  );
});

test("private DOM property payload marks React metadata, children, and events as non-payload", () => {
  const onClick = () => {};
  const ref = () => {};

  assert.deepEqual(
    diffDomPropertyPayload(
      "div",
      {},
      orderedProps([
        ["children", "Hello"],
        ["ref", ref],
        ["key", "stable-key"],
        ["onClick", onClick],
        ["onscroll", onClick],
        ["suppressHydrationWarning", true]
      ])
    ),
    [
      nonPayload(
        "children",
        "children",
        "children are handled by text-content reconciliation"
      ),
      nonPayload(
        "ref",
        "react-reserved-prop",
        "ref is handled by the ref attachment path"
      ),
      nonPayload(
        "key",
        "react-reserved-prop",
        "key is React element metadata and is not a DOM payload"
      ),
      nonPayload(
        "onClick",
        "event",
        "event props are stored by the future event/latest-props path"
      ),
      nonPayload(
        "onscroll",
        "event",
        "event props are stored by the future event/latest-props path"
      ),
      nonPayload(
        "suppressHydrationWarning",
        "hydration",
        "hydration warning suppression belongs to hydration diffing"
      )
    ]
  );
});

test("private DOM property payload records oracle-backed style and innerHTML entries", () => {
  assert.deepEqual(
    diffDomPropertyPayload(
      "div",
      {},
      orderedProps([
        [
          "style",
          orderedProps([
            ["color", "red"],
            ["marginTop", 4],
            ["opacity", 0.5],
            ["flex", 1],
            ["--gap", "4px"],
            ["--count", 3],
            ["backgroundImage", 'url("x&y")']
          ])
        ],
        ["dangerouslySetInnerHTML", { __html: "<span>raw</span>" }],
        ["innerHTML", "<span>raw</span>"]
      ])
    ),
    [
      setStyle("color", "propertyAssignment", "red"),
      setStyle("marginTop", "propertyAssignment", "4px"),
      setStyle("opacity", "propertyAssignment", "0.5"),
      setStyle("flex", "propertyAssignment", "1"),
      setStyle("--gap", "setProperty", "4px"),
      setStyle("--count", "setProperty", "3"),
      setStyle("backgroundImage", "propertyAssignment", 'url("x&y")'),
      setInnerHTML("<span>raw</span>"),
      unsupported(
        "innerHTML",
        "innerHTML",
        "innerHTML is reserved and is not handled as an ordinary attribute"
      )
    ]
  );
});

test("private DOM property payload records style update and removal order", () => {
  assert.deepEqual(
    diffDomPropertyPayload(
      "div",
      orderedProps([
        [
          "style",
          orderedProps([
            ["color", "red"],
            ["marginTop", 4],
            ["opacity", 0.5],
            ["flex", 1],
            ["--gap", "4px"],
            ["--count", 3],
            ["backgroundColor", "yellow"],
            ["borderWidth", 2],
            ["paddingLeft", "1em"]
          ])
        ]
      ]),
      orderedProps([
        [
          "style",
          orderedProps([
            ["color", null],
            ["marginTop", 0],
            ["opacity", null],
            ["--gap", null],
            ["backgroundColor", "blue"]
          ])
        ]
      ])
    ),
    [
      removeStyle("flex", "propertyAssignment"),
      removeStyle("--count", "setProperty"),
      removeStyle("borderWidth", "propertyAssignment"),
      removeStyle("paddingLeft", "propertyAssignment"),
      removeStyle("color", "propertyAssignment"),
      setStyle("marginTop", "propertyAssignment", "0"),
      removeStyle("opacity", "propertyAssignment"),
      removeStyle("--gap", "setProperty"),
      setStyle("backgroundColor", "propertyAssignment", "blue")
    ]
  );
});

test("private DOM property payload keeps invalid style behavior fail-closed", () => {
  assert.deepEqual(
    diffDomPropertyPayload(
      "div",
      {},
      orderedProps([["style", "color:red"]])
    ),
    [
      unsupported(
        "style",
        "style-shape-validation",
        "The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX."
      )
    ]
  );

  assert.deepEqual(
    diffDomPropertyPayload(
      "div",
      {},
      orderedProps([
        [
          "style",
          orderedProps([
            ["width", Number.NaN],
            ["height", Number.POSITIVE_INFINITY],
            ["background-color", "red"],
            ["msTransition", "all 1s"]
          ])
        ]
      ])
    ),
    [
      unsupported(
        "style",
        "style-non-finite-number",
        "non-finite numeric style values require warning diagnostics outside this data-only helper",
        { styleName: "width" }
      ),
      unsupported(
        "style",
        "style-non-finite-number",
        "non-finite numeric style values require warning diagnostics outside this data-only helper",
        { styleName: "height" }
      ),
      unsupported(
        "style",
        "unsupported-style-name",
        "this data-only style slice only covers oracle-backed style names and CSS custom properties",
        { styleName: "background-color" }
      ),
      setStyle("msTransition", "propertyAssignment", "all 1s")
    ]
  );
});

test("private DOM property payload validates dangerous HTML without mutating", () => {
  assert.deepEqual(
    diffDomPropertyPayload(
      "div",
      {},
      orderedProps([
        ["dangerouslySetInnerHTML", { __html: null }]
      ])
    ),
    [
      nonPayload(
        "dangerouslySetInnerHTML",
        "dangerouslySetInnerHTML-nullish-html",
        "nullish dangerouslySetInnerHTML.__html is accepted but does not assign innerHTML"
      )
    ]
  );

  assert.deepEqual(
    diffDomPropertyPayload(
      "div",
      orderedProps([
        ["dangerouslySetInnerHTML", { __html: "<span>Before</span>" }]
      ]),
      orderedProps([
        ["dangerouslySetInnerHTML", undefined],
        ["children", "Managed child"]
      ])
    ),
    [
      nonPayload(
        "dangerouslySetInnerHTML",
        "dangerouslySetInnerHTML-nullish",
        "nullish dangerouslySetInnerHTML does not assign innerHTML; managed children and text-content paths own clearing"
      ),
      nonPayload(
        "children",
        "children",
        "children are handled by text-content reconciliation"
      )
    ]
  );

  assert.deepEqual(
    diffDomPropertyPayload(
      "div",
      {},
      orderedProps([["dangerouslySetInnerHTML", "<strong>bad</strong>"]])
    ),
    [
      unsupported(
        "dangerouslySetInnerHTML",
        "dangerouslySetInnerHTML-shape-validation",
        "`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://react.dev/link/dangerously-set-inner-html for more information."
      )
    ]
  );

  assert.deepEqual(
    diffDomPropertyPayload(
      "div",
      {},
      orderedProps([
        ["dangerouslySetInnerHTML", { __html: "<span>Raw</span>" }],
        ["children", "Managed child"]
      ])
    ),
    [
      unsupported(
        "dangerouslySetInnerHTML",
        "dangerouslySetInnerHTML-children-conflict",
        "Can only set one of `children` or `props.dangerouslySetInnerHTML`."
      ),
      nonPayload(
        "children",
        "children",
        "children are handled by text-content reconciliation"
      )
    ]
  );
});

test("private DOM mutation adapter commits diffed admitted property rows in order", () => {
  const element = new FakeElement("button");
  element.setAttribute("title", "old-title");
  element.setAttribute("hidden", "");
  element.mutationLog = [];

  assert.deepEqual(
    commitDomPropertyUpdate(
      element,
      "button",
      orderedProps([
        ["title", "old-title"],
        ["hidden", true],
        ["children", "Old label"]
      ]),
      orderedProps([
        ["id", "next-id"],
        ["title", "new-title"],
        ["children", "New label"],
        ["style", orderedProps([["color", "red"]])],
        ["data-state", "ready"]
      ])
    ),
    [
      appliedRemoveAttribute("hidden"),
      appliedSetAttribute("id", "next-id"),
      appliedSetAttribute("title", "new-title"),
      skippedNonPayload(
        "children",
        "children",
        "children are handled by text-content reconciliation"
      ),
      setStyle("color", "propertyAssignment", "red"),
      appliedSetAttribute("data-state", "ready")
    ]
  );
  assert.deepEqual(element.activeAttributeEntries(), [
    ["data-state", "ready"],
    ["id", "next-id"],
    ["title", "new-title"]
  ]);
  assert.deepEqual(element.mutationLog, [
    ["removeAttribute", "hidden", true],
    ["setAttribute", "id", "next-id"],
    ["setAttribute", "title", "new-title"],
    ["stylePropertyAssignment", "color", "red"],
    ["setAttribute", "data-state", "ready"]
  ]);
});

test("private DOM admitted payload adapter accepts property rows and skips non-payload rows", () => {
  const element = new FakeElement("fast-widget");
  const value = { answer: 42 };

  assert.deepEqual(
    applyAdmittedDomPropertyPayload(element, [
      setProperty("objectProp", value),
      nonPayload(
        "onClick",
        "event",
        "event props are stored by the future event/latest-props path"
      ),
      removeProperty("objectProp")
    ]),
    [
      appliedSetProperty("objectProp", value),
      skippedNonPayload(
        "onClick",
        "event",
        "event props are stored by the future event/latest-props path"
      ),
      appliedRemoveProperty("objectProp")
    ]
  );
  assert.equal(element.objectProp, null);
  assert.deepEqual(element.mutationLog, [
    ["setProperty", "objectProp", value],
    ["setProperty", "objectProp", null]
  ]);
});

test("private DOM admitted payload adapter fails closed before unsupported rows mutate", () => {
  const controlled = new FakeElement("input");
  assert.throws(
    () =>
      commitDomPropertyUpdate(
        controlled,
        "input",
        {},
        orderedProps([
          ["id", "must-not-apply"],
          ["value", "Ada"]
        ])
      ),
    {
      code: "FAST_REACT_DOM_BLOCKED_PROPERTY_PAYLOAD_ENTRY"
    }
  );
  assert.deepEqual(controlled.mutationLog, []);
  assert.deepEqual(controlled.activeAttributeEntries(), []);

  const invalidStyle = new FakeElement("div");
  assert.throws(
    () =>
      commitDomPropertyUpdate(
        invalidStyle,
        "div",
        {},
        orderedProps([
          ["id", "must-not-apply"],
          ["style", orderedProps([["width", Number.NaN]])]
        ])
      ),
    {
      code: "FAST_REACT_DOM_BLOCKED_PROPERTY_PAYLOAD_ENTRY"
    }
  );
  assert.deepEqual(invalidStyle.mutationLog, []);
  assert.deepEqual(invalidStyle.activeAttributeEntries(), []);

  const resource = new FakeElement("link");
  assert.throws(
    () =>
      commitDomPropertyUpdate(
        resource,
        "link",
        {},
        orderedProps([
          ["rel", "stylesheet"],
          ["href", "/app.css"]
        ])
      ),
    {
      code: "FAST_REACT_DOM_BLOCKED_PROPERTY_PAYLOAD_ENTRY"
    }
  );
  assert.deepEqual(resource.mutationLog, []);
  assert.deepEqual(resource.activeAttributeEntries(), []);
});

test("private DOM style and innerHTML applier applies accepted payload records in order", () => {
  const element = new FakeElement("div");
  const payload = diffDomPropertyPayload(
    "div",
    {},
    orderedProps([
      [
        "style",
        orderedProps([
          ["color", "red"],
          ["marginTop", 4],
          ["opacity", 0.5],
          ["flex", 1],
          ["--gap", "4px"],
          ["--count", 3],
          ["backgroundImage", 'url("x&y")']
        ])
      ],
      ["dangerouslySetInnerHTML", { __html: "<span>raw</span>" }]
    ])
  );

  assert.deepEqual(applyStyleDangerousHtmlPayload(element, payload), [
    setStyle("color", "propertyAssignment", "red"),
    setStyle("marginTop", "propertyAssignment", "4px"),
    setStyle("opacity", "propertyAssignment", "0.5"),
    setStyle("flex", "propertyAssignment", "1"),
    setStyle("--gap", "setProperty", "4px"),
    setStyle("--count", "setProperty", "3"),
    setStyle("backgroundImage", "propertyAssignment", 'url("x&y")'),
    setInnerHTML("<span>raw</span>")
  ]);
  assert.deepEqual(element.mutationLog, [
    ["stylePropertyAssignment", "color", "red"],
    ["stylePropertyAssignment", "marginTop", "4px"],
    ["stylePropertyAssignment", "opacity", "0.5"],
    ["stylePropertyAssignment", "flex", "1"],
    ["styleSetProperty", "--gap", "4px"],
    ["styleSetProperty", "--count", "3"],
    ["stylePropertyAssignment", "backgroundImage", 'url("x&y")'],
    ["setInnerHTML", "<span>raw</span>"]
  ]);
  assert.deepEqual(element.activeStyleProperties(), [
    ["--count", "3"],
    ["--gap", "4px"],
    ["backgroundImage", 'url("x&y")'],
    ["color", "red"],
    ["flex", "1"],
    ["marginTop", "4px"],
    ["opacity", "0.5"]
  ]);
  assert.equal(element.assignedInnerHTML, "<span>raw</span>");
  assert.deepEqual(element.childNodes, []);
});

test("private DOM style applier applies update and removal records deterministically", () => {
  const element = new FakeElement("div");
  const initialPayload = diffDomPropertyPayload(
    "div",
    {},
    orderedProps([
      [
        "style",
        orderedProps([
          ["color", "red"],
          ["marginTop", 4],
          ["opacity", 0.5],
          ["flex", 1],
          ["--gap", "4px"],
          ["--count", 3],
          ["backgroundColor", "yellow"],
          ["borderWidth", 2],
          ["paddingLeft", "1em"]
        ])
      ]
    ])
  );
  const updatePayload = diffDomPropertyPayload(
    "div",
    orderedProps([
      [
        "style",
        orderedProps([
          ["color", "red"],
          ["marginTop", 4],
          ["opacity", 0.5],
          ["flex", 1],
          ["--gap", "4px"],
          ["--count", 3],
          ["backgroundColor", "yellow"],
          ["borderWidth", 2],
          ["paddingLeft", "1em"]
        ])
      ]
    ]),
    orderedProps([
      [
        "style",
        orderedProps([
          ["color", null],
          ["marginTop", 0],
          ["opacity", null],
          ["--gap", null],
          ["backgroundColor", "blue"]
        ])
      ]
    ])
  );

  applyStyleDangerousHtmlPayload(element, initialPayload);
  element.mutationLog = [];

  assert.deepEqual(applyStyleDangerousHtmlPayload(element, updatePayload), [
    removeStyle("flex", "propertyAssignment"),
    removeStyle("--count", "setProperty"),
    removeStyle("borderWidth", "propertyAssignment"),
    removeStyle("paddingLeft", "propertyAssignment"),
    removeStyle("color", "propertyAssignment"),
    setStyle("marginTop", "propertyAssignment", "0"),
    removeStyle("opacity", "propertyAssignment"),
    removeStyle("--gap", "setProperty"),
    setStyle("backgroundColor", "propertyAssignment", "blue")
  ]);
  assert.deepEqual(element.mutationLog, [
    ["stylePropertyAssignment", "flex", ""],
    ["styleSetProperty", "--count", ""],
    ["stylePropertyAssignment", "borderWidth", ""],
    ["stylePropertyAssignment", "paddingLeft", ""],
    ["stylePropertyAssignment", "color", ""],
    ["stylePropertyAssignment", "marginTop", "0"],
    ["stylePropertyAssignment", "opacity", ""],
    ["styleSetProperty", "--gap", ""],
    ["stylePropertyAssignment", "backgroundColor", "blue"]
  ]);
  assert.deepEqual(element.activeStyleProperties(), [
    ["backgroundColor", "blue"],
    ["marginTop", "0"]
  ]);
});

test("private DOM style and innerHTML applier fails closed before mutating unsupported records", () => {
  const element = new FakeElement("div");
  const invalidStylePayload = diffDomPropertyPayload(
    "div",
    {},
    orderedProps([
      [
        "style",
        orderedProps([
          ["color", "red"],
          ["width", Number.NaN]
        ])
      ],
      ["dangerouslySetInnerHTML", { __html: "<span>raw</span>" }]
    ])
  );

  assert.throws(
    () => applyStyleDangerousHtmlPayload(element, invalidStylePayload),
    {
      code: "FAST_REACT_DOM_UNSUPPORTED_PAYLOAD_ENTRY"
    }
  );
  assert.deepEqual(element.mutationLog, []);
  assert.deepEqual(element.activeStyleProperties(), []);
  assert.equal(element.assignedInnerHTML, null);

  assert.throws(
    () =>
      applyStyleDangerousHtmlPayload(
        element,
        diffDomPropertyPayload(
          "div",
          {},
          orderedProps([["dangerouslySetInnerHTML", { __html: null }]])
        )
      ),
    {
      code: "FAST_REACT_DOM_NON_PAYLOAD_ENTRY"
    }
  );
  assert.deepEqual(element.mutationLog, []);
});

test("private DOM style and innerHTML applier rejects ordinary attribute records", () => {
  const element = new FakeElement("div");
  const attributePayload = diffDomPropertyPayload(
    "div",
    {},
    orderedProps([["id", "not-this-worker"]])
  );

  assert.throws(
    () => applyStyleDangerousHtmlPayload(element, attributePayload),
    {
      code: "FAST_REACT_DOM_UNSUPPORTED_PAYLOAD_ENTRY"
    }
  );
  assert.deepEqual(element.mutationLog, []);
  assert.deepEqual(element.activeStyleProperties(), []);
});

test("private DOM property payload reports controlled form and document resource host entries as unsupported", () => {
  assert.deepEqual(
    diffDomPropertyPayload(
      "input",
      {},
      orderedProps([
        ["id", "name-field"],
        ["type", "text"],
        ["value", "Ada"],
        ["checked", false],
        ["defaultValue", "Grace"]
      ])
    ),
    [
      setAttribute("id", "id", "name-field"),
      controlledUnsupported("input", "type"),
      controlledUnsupported("input", "value"),
      controlledUnsupported("input", "checked"),
      controlledUnsupported("input", "defaultValue")
    ]
  );

  assert.deepEqual(
    diffDomPropertyPayload(
      "link",
      {},
      orderedProps([
        ["rel", "stylesheet"],
        ["href", "/app.css"]
      ])
    ),
    [
      unsupported(
        "rel",
        "document-resource-host",
        "document-scoped resource host tags require dedicated React DOM handling"
      ),
      unsupported(
        "href",
        "document-resource-host",
        "document-scoped resource host tags require dedicated React DOM handling"
      )
    ]
  );

  assert.deepEqual(
    diffDomPropertyPayload(
      "select",
      {},
      orderedProps([
        ["value", "a"],
        ["defaultValue", "b"],
        ["multiple", true]
      ])
    ),
    [
      controlledUnsupported("select", "value"),
      controlledUnsupported("select", "defaultValue"),
      controlledUnsupported("select", "multiple")
    ]
  );

  assert.deepEqual(
    diffDomPropertyPayload(
      "textarea",
      {},
      orderedProps([
        ["value", "Ada"],
        ["defaultValue", "Grace"]
      ])
    ),
    [
      controlledUnsupported("textarea", "value"),
      controlledUnsupported("textarea", "defaultValue")
    ]
  );

  assert.deepEqual(
    diffDomPropertyPayload(
      "button",
      {},
      orderedProps([
        ["formAction", "/submit"],
        ["formMethod", "post"]
      ])
    ),
    [
      unsupported(
        "formAction",
        "form-action",
        "form action props are intentionally outside this ordinary attribute helper"
      ),
      unsupported(
        "formMethod",
        "form-action",
        "form action props are intentionally outside this ordinary attribute helper"
      )
    ]
  );
});

test("private DOM property payload helper remains private to the package surface", () => {
  assert.equal(
    Object.keys(reactDomPackageJson.exports).includes(
      "./src/dom-host/property-payload"
    ),
    false
  );
});

test("private DOM property payload classifies only ordinary application records", () => {
  assert.equal(
    isOrdinaryPropertyPayloadEntry(setAttribute("id", "id", "alpha")),
    true
  );
  assert.equal(
    isOrdinaryPropertyPayloadEntry(removeAttribute("hidden", "hidden")),
    true
  );
  assert.equal(
    isOrdinaryPropertyPayloadEntry(setProperty("boolProp", true)),
    true
  );
  assert.equal(
    isOrdinaryPropertyPayloadEntry(removeProperty("objectProp")),
    true
  );

  assert.equal(
    isOrdinaryPropertyPayloadEntry(
      setStyle("color", "propertyAssignment", "red")
    ),
    false
  );
  assert.equal(isOrdinaryPropertyPayloadEntry(setInnerHTML("<b>x</b>")), false);
  assert.equal(
    isOrdinaryPropertyPayloadEntry(
      nonPayload("children", "children", "handled elsewhere")
    ),
    false
  );
  assert.equal(
    isOrdinaryPropertyPayloadEntry(
      unsupported("value", "controlled-input", "handled elsewhere")
    ),
    false
  );

  assert.equal(
    isStyleDangerousHtmlPayloadEntry(
      setStyle("color", "propertyAssignment", "red")
    ),
    true
  );
  assert.equal(isStyleDangerousHtmlPayloadEntry(setInnerHTML("<b>x</b>")), true);
  assert.equal(
    isStyleDangerousHtmlPayloadEntry(setAttribute("id", "id", "alpha")),
    false
  );
  assert.equal(
    isNonPayloadPropertyPayloadEntry(
      nonPayload("children", "children", "handled elsewhere")
    ),
    true
  );
  assert.equal(
    isNonPayloadPropertyPayloadEntry(
      unsupported("value", "controlled-input", "handled elsewhere")
    ),
    false
  );
});

function orderedProps(entries) {
  const props = {};
  for (const [key, value] of entries) {
    props[key] = value;
  }
  return props;
}

function setAttribute(propName, attributeName, value) {
  return {
    kind: ENTRY_SET_ATTRIBUTE,
    propName,
    attributeName,
    value
  };
}

function removeAttribute(propName, attributeName) {
  return {
    kind: ENTRY_REMOVE_ATTRIBUTE,
    propName,
    attributeName
  };
}

function appliedSetAttribute(attributeName, value) {
  return {
    kind: ENTRY_SET_ATTRIBUTE,
    attributeName,
    value
  };
}

function appliedRemoveAttribute(attributeName) {
  return {
    kind: ENTRY_REMOVE_ATTRIBUTE,
    attributeName
  };
}

function setProperty(propertyName, value) {
  return {
    kind: ENTRY_SET_PROPERTY,
    propName: propertyName,
    propertyName,
    value
  };
}

function removeProperty(propertyName) {
  return {
    kind: ENTRY_REMOVE_PROPERTY,
    propName: propertyName,
    propertyName
  };
}

function appliedSetProperty(propertyName, value) {
  return {
    kind: ENTRY_SET_PROPERTY,
    propertyName,
    value
  };
}

function appliedRemoveProperty(propertyName) {
  return {
    kind: ENTRY_REMOVE_PROPERTY,
    propertyName,
    value: null
  };
}

function setStyle(styleName, mutation, value) {
  return {
    kind: ENTRY_SET_STYLE,
    propName: "style",
    styleName,
    mutation,
    value
  };
}

function removeStyle(styleName, mutation) {
  return {
    kind: ENTRY_REMOVE_STYLE,
    propName: "style",
    styleName,
    mutation,
    value: ""
  };
}

function setInnerHTML(value) {
  return {
    kind: ENTRY_SET_INNER_HTML,
    propName: "dangerouslySetInnerHTML",
    propertyName: "innerHTML",
    value
  };
}

function nonPayload(propName, category, reason) {
  return {
    kind: ENTRY_NON_PAYLOAD,
    propName,
    category,
    reason
  };
}

function skippedNonPayload(propName, category, reason) {
  return {
    kind: ENTRY_NON_PAYLOAD,
    propName,
    category,
    reason,
    status: "skipped"
  };
}

function unsupported(propName, category, reason, details) {
  const entry = {
    kind: ENTRY_UNSUPPORTED,
    propName,
    category,
    reason
  };
  if (details !== undefined) {
    return {
      ...entry,
      ...details
    };
  }
  return entry;
}

function controlledUnsupported(hostTag, propName) {
  return unsupported(
    propName,
    `controlled-${hostTag}`,
    `controlled ${hostTag} props are handled by the controlled form wrapper path`,
    {
      controlledFormBoundary: {
        propertyPayloadStatus: CONTROLLED_FORM_PROPERTY_PAYLOAD_STATUS,
        valueTrackerGateStatus: CONTROLLED_VALUE_TRACKER_GATE_STATUS,
        hostTag,
        ordinaryPayloadAccepted: false,
        sourceAdapterInvoked: false,
        liveTrackingStarted: false,
        postEventRestoreQueued: false,
        publicControlledBehaviorEnabled: false,
        compatibilityClaimed: false
      }
    }
  );
}

class FakeElement {
  constructor(nodeName) {
    this.nodeName = nodeName.toUpperCase();
    this.nodeType = 1;
    this.childNodes = [];
    this.attributes = new Map();
    this._objectProp = null;
    this.mutationLog = [];
    this.style = new FakeStyle(this);
    this.assignedInnerHTML = null;
  }

  get innerHTML() {
    return this.assignedInnerHTML ?? "";
  }

  set innerHTML(value) {
    const html = String(value);
    this.mutationLog.push(["setInnerHTML", html]);
    this.childNodes = [];
    this.assignedInnerHTML = html;
  }

  activeStyleProperties() {
    return Array.from(this.style.properties.entries())
      .filter(([, value]) => value !== "")
      .sort(([left], [right]) => left.localeCompare(right));
  }

  activeAttributeEntries() {
    return Array.from(this.attributes.entries()).sort(([left], [right]) =>
      left.localeCompare(right)
    );
  }

  get objectProp() {
    return this._objectProp;
  }

  set objectProp(value) {
    this.mutationLog.push(["setProperty", "objectProp", value]);
    this._objectProp = value;
  }

  setAttribute(name, value) {
    const attributeName = String(name);
    const stringValue = String(value);
    this.mutationLog.push(["setAttribute", attributeName, stringValue]);
    this.attributes.set(attributeName, stringValue);
  }

  removeAttribute(name) {
    const attributeName = String(name);
    this.mutationLog.push([
      "removeAttribute",
      attributeName,
      this.attributes.has(attributeName)
    ]);
    this.attributes.delete(attributeName);
  }
}

class FakeStyle {
  constructor(ownerElement) {
    this.ownerElement = ownerElement;
    this.properties = new Map();

    return new Proxy(this, {
      set(target, property, value, receiver) {
        if (shouldRecordStyleProperty(property)) {
          const stringValue = String(value);
          target.properties.set(property, stringValue);
          target.ownerElement.mutationLog.push([
            "stylePropertyAssignment",
            property,
            stringValue
          ]);
        }
        return Reflect.set(target, property, value, receiver);
      }
    });
  }

  setProperty(name, value) {
    const propertyName = String(name);
    const stringValue = String(value);
    this.properties.set(propertyName, stringValue);
    this.ownerElement.mutationLog.push([
      "styleSetProperty",
      propertyName,
      stringValue
    ]);
  }
}

function shouldRecordStyleProperty(property) {
  return (
    typeof property === "string" &&
    !property.startsWith("_") &&
    !["ownerElement", "properties", "setProperty"].includes(property)
  );
}
