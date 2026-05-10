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
const reactDomPackageJson = require(
  path.join(repoRoot, "packages", "react-dom", "package.json")
);

const {
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
  isOrdinaryPropertyPayloadEntry
} = propertyPayload;

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
      unsupported(
        "type",
        "controlled-input",
        "controlled input props are handled by the controlled form wrapper path"
      ),
      unsupported(
        "value",
        "controlled-input",
        "controlled input props are handled by the controlled form wrapper path"
      ),
      unsupported(
        "checked",
        "controlled-input",
        "controlled input props are handled by the controlled form wrapper path"
      ),
      unsupported(
        "defaultValue",
        "controlled-input",
        "controlled input props are handled by the controlled form wrapper path"
      )
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
      unsupported(
        "value",
        "controlled-select",
        "controlled select props are handled by the controlled form wrapper path"
      ),
      unsupported(
        "defaultValue",
        "controlled-select",
        "controlled select props are handled by the controlled form wrapper path"
      ),
      unsupported(
        "multiple",
        "controlled-select",
        "controlled select props are handled by the controlled form wrapper path"
      )
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
      unsupported(
        "value",
        "controlled-textarea",
        "controlled textarea props are handled by the controlled form wrapper path"
      ),
      unsupported(
        "defaultValue",
        "controlled-textarea",
        "controlled textarea props are handled by the controlled form wrapper path"
      )
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
