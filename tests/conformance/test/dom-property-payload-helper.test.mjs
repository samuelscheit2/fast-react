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
const resourceFormGate = require(
  path.join(
    repoRoot,
    "packages",
    "react-dom",
    "src",
    "resource-form-internals-gate.js"
  )
);
const domMutation = require(
  path.join(repoRoot, "packages", "react-dom", "src", "dom-host", "mutation.js")
);
const componentTree = require(
  path.join(
    repoRoot,
    "packages",
    "react-dom",
    "src",
    "client",
    "component-tree.js"
  )
);
const reactDomPackageJson = require(
  path.join(repoRoot, "packages", "react-dom", "package.json")
);

const {
  CONTROLLED_FORM_PROPERTY_PAYLOAD_STATUS,
  CONTROLLED_PRIVATE_WRAPPER_PROPERTY_PAYLOAD_STATUS,
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
  applyDomPropertyPayloadForLatestProps,
  applyStyleDangerousHtmlPayload,
  commitDomPropertyUpdateForLatestProps,
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

test("private DOM latest-props handoff publishes only after ordinary mutations succeed", () => {
  const element = new FakeElement("button");
  const rootOwner = { kind: "LatestPropsRoot" };
  const hostOwner = { kind: "LatestPropsHost" };
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  const initialProps = orderedProps([
    ["title", "old-title"],
    ["hidden", true],
    ["onClick", () => "old"]
  ]);
  const nextProps = orderedProps([
    ["id", "next-id"],
    ["title", "new-title"],
    ["onClick", () => "new"],
    ["data-state", "ready"]
  ]);

  element.setAttribute("title", "old-title");
  element.setAttribute("hidden", "");
  element.mutationLog = [];
  componentTree.attachHostInstanceNode(element, token, initialProps);

  const handoff = commitDomPropertyUpdateForLatestProps(
    element,
    "button",
    initialProps,
    nextProps
  );
  const hiddenHandoff =
    domMutation.getDomPropertyUpdateLatestPropsHandoffPayload(handoff);
  const latestPropsPayload = domMutation.getLatestPropsCommitRecordPayload(
    hiddenHandoff.latestPropsCommitRecord
  );

  assert.equal(
    handoff.kind,
    domMutation.DOM_PROPERTY_UPDATE_LATEST_PROPS_HANDOFF
  );
  assert.equal(handoff.status, "mutated");
  assert.equal(handoff.payloadCount, 5);
  assert.equal(Object.hasOwn(handoff, "node"), false);
  assert.equal(Object.hasOwn(handoff, "latestProps"), false);
  assert.deepEqual(element.mutationLog, [
    ["removeAttribute", "hidden", true],
    ["setAttribute", "id", "next-id"],
    ["setAttribute", "title", "new-title"],
    ["setAttribute", "data-state", "ready"]
  ]);
  assert.equal(componentTree.getLatestPropsFromNode(element), initialProps);
  assert.equal(latestPropsPayload.latestProps, nextProps);
  assert.deepEqual(latestPropsPayload.payloadRecords, [
    removeAttribute("hidden", "hidden"),
    setAttribute("id", "id", "next-id"),
    setAttribute("title", "title", "new-title"),
    skippedNonPayload(
      "onClick",
      "event",
      "event props are stored by the future event/latest-props path"
    ),
    setAttribute("data-state", "data-state", "ready")
  ]);

  assert.equal(
    componentTree.commitLatestPropsFromMutationHandoff(handoff),
    nextProps
  );
  assert.equal(componentTree.getLatestPropsFromNode(element), nextProps);
  assert.equal(componentTree.detachHostInstanceToken(token), token);
});

test("private DOM latest-props handoff accepts ordinary property payload rows", () => {
  const element = new FakeElement("fast-widget");
  const rootOwner = { kind: "LatestPropsPropertyRoot" };
  const hostOwner = { kind: "LatestPropsPropertyHost" };
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  const initialProps = { objectProp: null };
  const value = { answer: 42 };
  const nextProps = {
    objectProp: null,
    onWidget() {
      return value.answer;
    }
  };

  componentTree.attachHostInstanceNode(element, token, initialProps);
  const handoff = applyDomPropertyPayloadForLatestProps(
    element,
    [
      setProperty("objectProp", value),
      nonPayload(
        "onWidget",
        "event",
        "event props are stored by the future event/latest-props path"
      ),
      removeProperty("objectProp")
    ],
    nextProps
  );

  assert.deepEqual(element.mutationLog, [
    ["setProperty", "objectProp", value],
    ["setProperty", "objectProp", null]
  ]);
  assert.equal(element.objectProp, null);
  assert.equal(componentTree.getLatestPropsFromNode(element), initialProps);
  assert.equal(
    componentTree.commitLatestPropsFromMutationHandoff(handoff),
    nextProps
  );
  assert.equal(componentTree.getLatestPropsFromNode(element), nextProps);
  assert.equal(componentTree.detachHostInstanceToken(token), token);
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

test("private DOM latest-props handoff keeps failed payloads out of the component-tree map", () => {
  const controlled = new FakeElement("input");
  const controlledToken = componentTree.createHostInstanceToken(
    { kind: "LatestPropsControlledHost" },
    { kind: "LatestPropsControlledRoot" }
  );
  const controlledInitialProps = {};
  componentTree.attachHostInstanceNode(
    controlled,
    controlledToken,
    controlledInitialProps
  );

  assert.throws(
    () =>
      commitDomPropertyUpdateForLatestProps(
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
  assert.equal(
    componentTree.getLatestPropsFromNode(controlled),
    controlledInitialProps
  );
  assert.equal(
    componentTree.detachHostInstanceToken(controlledToken),
    controlledToken
  );

  const styled = new FakeElement("div");
  const styledToken = componentTree.createHostInstanceToken(
    { kind: "LatestPropsStyleHost" },
    { kind: "LatestPropsStyleRoot" }
  );
  const styledInitialProps = {};
  componentTree.attachHostInstanceNode(styled, styledToken, styledInitialProps);

  assert.throws(
    () =>
      commitDomPropertyUpdateForLatestProps(
        styled,
        "div",
        {},
        orderedProps([
          ["id", "must-not-apply"],
          ["style", orderedProps([["color", "red"]])]
        ])
      ),
    {
      code: "FAST_REACT_DOM_BLOCKED_PROPERTY_PAYLOAD_ENTRY"
    }
  );
  assert.deepEqual(styled.mutationLog, []);
  assert.equal(componentTree.getLatestPropsFromNode(styled), styledInitialProps);
  assert.equal(componentTree.detachHostInstanceToken(styledToken), styledToken);

  const throwing = new FakeElement("div");
  const throwingToken = componentTree.createHostInstanceToken(
    { kind: "LatestPropsThrowingHost" },
    { kind: "LatestPropsThrowingRoot" }
  );
  const throwingInitialProps = {};
  const thrownError = new Error("fake setAttribute failed");
  throwing.setAttribute = function setAttribute() {
    throw thrownError;
  };
  componentTree.attachHostInstanceNode(
    throwing,
    throwingToken,
    throwingInitialProps
  );

  assert.throws(
    () =>
      commitDomPropertyUpdateForLatestProps(
        throwing,
        "div",
        {},
        orderedProps([["id", "must-not-apply"]])
      ),
    (error) => error === thrownError
  );
  assert.deepEqual(throwing.mutationLog, []);
  assert.equal(
    componentTree.getLatestPropsFromNode(throwing),
    throwingInitialProps
  );
  assert.equal(
    componentTree.detachHostInstanceToken(throwingToken),
    throwingToken
  );
});

test("private DOM latest-props handoff rolls back partial fake-DOM mutations on failure", () => {
  const element = new FakeElement("div");
  const token = componentTree.createHostInstanceToken(
    { kind: "LatestPropsRollbackHost" },
    { kind: "LatestPropsRollbackRoot" }
  );
  const initialProps = orderedProps([["title", "old-title"]]);
  const nextProps = orderedProps([
    ["id", "temporary-id"],
    ["data-state", "ready"]
  ]);
  const thrownError = new Error("fake setAttribute failed after mutation");
  const originalSetAttribute = element.setAttribute;

  element.setAttribute("title", "old-title");
  element.mutationLog = [];
  element.setAttribute = function setAttribute(name, value) {
    originalSetAttribute.call(this, name, value);
    if (String(name) === "data-state") {
      throw thrownError;
    }
  };

  componentTree.attachHostInstanceNode(element, token, initialProps);

  assert.throws(
    () =>
      commitDomPropertyUpdateForLatestProps(
        element,
        "div",
        initialProps,
        nextProps
      ),
    (error) => error === thrownError
  );
  assert.deepEqual(element.activeAttributeEntries(), [["title", "old-title"]]);
  assert.deepEqual(element.mutationLog, [
    ["removeAttribute", "title", true],
    ["setAttribute", "id", "temporary-id"],
    ["setAttribute", "data-state", "ready"],
    ["removeAttribute", "data-state", true],
    ["removeAttribute", "id", true],
    ["setAttribute", "title", "old-title"]
  ]);
  assert.equal(componentTree.getLatestPropsFromNode(element), initialProps);
  assert.equal(componentTree.detachHostInstanceToken(token), token);
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
  const inputProps = orderedProps([
    ["id", "name-field"],
    ["type", "text"],
    ["value", "Ada"],
    ["checked", false],
    ["defaultValue", "Grace"]
  ]);
  assert.deepEqual(
    diffDomPropertyPayload(
      "input",
      {},
      inputProps
    ),
    [
      setAttribute("id", "id", "name-field"),
      controlledUnsupported("input", "type", inputProps),
      controlledUnsupported("input", "value", inputProps),
      controlledUnsupported("input", "checked", inputProps),
      controlledUnsupported("input", "defaultValue", inputProps)
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

  const selectProps = orderedProps([
    ["value", "a"],
    ["defaultValue", "b"],
    ["multiple", true]
  ]);
  assert.deepEqual(
    diffDomPropertyPayload(
      "select",
      {},
      selectProps
    ),
    [
      controlledUnsupported("select", "value", selectProps),
      controlledUnsupported("select", "defaultValue", selectProps),
      controlledUnsupported("select", "multiple", selectProps)
    ]
  );

  const textareaProps = orderedProps([
    ["value", "Ada"],
    ["defaultValue", "Grace"]
  ]);
  assert.deepEqual(
    diffDomPropertyPayload(
      "textarea",
      {},
      textareaProps
    ),
    [
      controlledUnsupported("textarea", "value", textareaProps),
      controlledUnsupported("textarea", "defaultValue", textareaProps)
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

test("private DOM controlled payload rows carry wrapper metadata without live tracker effects", () => {
  const cases = [
    {
      tag: "input",
      props: orderedProps([
        ["type", "checkbox"],
        ["name", "accepted"],
        ["checked", true],
        ["defaultChecked", false]
      ])
    },
    {
      tag: "select",
      props: orderedProps([
        ["value", ["a"]],
        ["defaultValue", ["b"]],
        ["multiple", true]
      ])
    },
    {
      tag: "textarea",
      props: orderedProps([
        ["value", "Ada"],
        ["defaultValue", "Grace"]
      ])
    }
  ];
  const summaries = [];

  for (const { tag, props } of cases) {
    const controlledEntries = diffDomPropertyPayload(
      tag,
      {},
      props
    ).filter((entry) => entry.kind === ENTRY_UNSUPPORTED);

    for (const entry of controlledEntries) {
      const boundary = entry.controlledFormBoundary;
      const record = boundary.privateWrapperGateRecord;

      assert.equal(
        boundary.privateWrapperGateStatus,
        CONTROLLED_PRIVATE_WRAPPER_PROPERTY_PAYLOAD_STATUS
      );
      assert.equal(Object.isFrozen(record), true);
      assert.equal(
        resourceFormGate.isPrivateControlledInputWrapperPropertyPayloadRecord(
          record
        ),
        true
      );
      assert.equal(
        resourceFormGate.getPrivateControlledInputWrapperPropertyPayloadRecordPayload(
          record
        ),
        record
      );
      assert.deepEqual(
        record.sideEffects,
        resourceFormGate.controlledInputPrivateWrapperSideEffects
      );
      assert.equal(record.sideEffects.hostValueRead, false);
      assert.equal(record.sideEffects.hostValueWritten, false);
      assert.equal(record.sideEffects.propertyDescriptorInstalled, false);
      assert.equal(record.sideEffects.trackerAttached, false);
      assert.equal(record.sideEffects.hostWrapperInvoked, false);
      assert.equal(record.sideEffects.wrapperPropertyWritten, false);
      assert.equal(record.sideEffects.postEventRestoreQueued, false);
      assert.equal(record.sideEffects.latestPropsLookup, false);
      assert.equal(record.wrapperMetadata.deterministicMetadataOnly, true);
      assert.equal(record.wrapperMetadata.propertyPayloadRowAccepted, false);
      assert.equal(record.wrapperMetadata.hostWrapperInvoked, false);
      assert.equal(record.wrapperMetadata.wrapperPropertyWritten, false);
      assert.equal(record.wrapperMetadata.liveHostNodeRequired, false);
      assert.equal(record.wrapperMetadata.rawTargetCaptured, false);
      assert.equal(record.wrapperMetadata.trackerAttached, false);
      assert.equal(record.valueTrackerMetadata.trackerAttached, false);
      assert.equal(record.valueTrackerMetadata.currentValueSnapshot, null);
      assert.equal(record.postEventRestoreBoundary.latestPropsLookup, false);
      assert.equal(record.postEventRestoreBoundary.eventPluginDispatch, false);
      assert.equal(record.postEventRestoreBoundary.restoreQueued, false);
      assert.equal(record.postEventRestoreBoundary.restoreFlushed, false);
      assert.equal(
        record.publicControlledBehaviorBoundary.hostWrapperWrites,
        false
      );

      summaries.push({
        requestType: record.requestType,
        contractId: record.contractId,
        hostTag: record.hostTag,
        propName: record.propName,
        controlKind: record.controlKind,
        inputType: record.inputType,
        multiple: record.multiple,
        wrapperKind: record.wrapperMetadata.wrapperKind,
        wrapperOperations: record.wrapperMetadata.wrapperOperations,
        valueTrackerContractId:
          record.wrapperMetadata.valueTrackerContractId,
        trackedField: record.wrapperMetadata.trackedField
      });
    }
  }

  assert.deepEqual(summaries, [
    {
      requestType: "controlled-wrapper.input.type",
      contractId: "input-wrapper-type-payload",
      hostTag: "input",
      propName: "type",
      controlKind: "checked",
      inputType: "checkbox",
      multiple: false,
      wrapperKind: "input-host-wrapper",
      wrapperOperations: ["validateInputProps", "initInput", "updateInput"],
      valueTrackerContractId: "input-checked-tracker",
      trackedField: "checked"
    },
    {
      requestType: "controlled-wrapper.input.name",
      contractId: "input-wrapper-name-payload",
      hostTag: "input",
      propName: "name",
      controlKind: "checked",
      inputType: "checkbox",
      multiple: false,
      wrapperKind: "input-host-wrapper",
      wrapperOperations: [
        "initInput",
        "updateInput",
        "restoreControlledInputState"
      ],
      valueTrackerContractId: "input-checked-tracker",
      trackedField: "checked"
    },
    {
      requestType: "controlled-wrapper.input.checked",
      contractId: "input-wrapper-checked-payload",
      hostTag: "input",
      propName: "checked",
      controlKind: "checked",
      inputType: "checkbox",
      multiple: false,
      wrapperKind: "input-host-wrapper",
      wrapperOperations: [
        "validateInputProps",
        "initInput",
        "updateInput",
        "restoreControlledInputState"
      ],
      valueTrackerContractId: "input-checked-tracker",
      trackedField: "checked"
    },
    {
      requestType: "controlled-wrapper.input.defaultChecked",
      contractId: "input-wrapper-default-checked-payload",
      hostTag: "input",
      propName: "defaultChecked",
      controlKind: "checked",
      inputType: "checkbox",
      multiple: false,
      wrapperKind: "input-host-wrapper",
      wrapperOperations: [
        "validateInputProps",
        "initInput",
        "updateInput",
        "restoreControlledInputState"
      ],
      valueTrackerContractId: "input-checked-tracker",
      trackedField: "checked"
    },
    {
      requestType: "controlled-wrapper.select.value",
      contractId: "select-wrapper-value-payload",
      hostTag: "select",
      propName: "value",
      controlKind: "multiple",
      inputType: null,
      multiple: true,
      wrapperKind: "select-host-wrapper",
      wrapperOperations: ["validateSelectProps", "initSelect", "updateSelect"],
      valueTrackerContractId: "select-multiple-value-tracker",
      trackedField: "selectedOptions"
    },
    {
      requestType: "controlled-wrapper.select.defaultValue",
      contractId: "select-wrapper-default-value-payload",
      hostTag: "select",
      propName: "defaultValue",
      controlKind: "multiple",
      inputType: null,
      multiple: true,
      wrapperKind: "select-host-wrapper",
      wrapperOperations: ["validateSelectProps", "initSelect", "updateSelect"],
      valueTrackerContractId: "select-multiple-value-tracker",
      trackedField: "selectedOptions"
    },
    {
      requestType: "controlled-wrapper.select.multiple",
      contractId: "select-wrapper-multiple-payload",
      hostTag: "select",
      propName: "multiple",
      controlKind: "multiple",
      inputType: null,
      multiple: true,
      wrapperKind: "select-host-wrapper",
      wrapperOperations: ["validateSelectProps", "initSelect", "updateSelect"],
      valueTrackerContractId: "select-multiple-value-tracker",
      trackedField: "selectedOptions"
    },
    {
      requestType: "controlled-wrapper.textarea.value",
      contractId: "textarea-wrapper-value-payload",
      hostTag: "textarea",
      propName: "value",
      controlKind: "value",
      inputType: null,
      multiple: false,
      wrapperKind: "textarea-host-wrapper",
      wrapperOperations: [
        "validateTextareaProps",
        "initTextarea",
        "updateTextarea"
      ],
      valueTrackerContractId: "textarea-value-tracker",
      trackedField: "value"
    },
    {
      requestType: "controlled-wrapper.textarea.defaultValue",
      contractId: "textarea-wrapper-default-value-payload",
      hostTag: "textarea",
      propName: "defaultValue",
      controlKind: "value",
      inputType: null,
      multiple: false,
      wrapperKind: "textarea-host-wrapper",
      wrapperOperations: [
        "validateTextareaProps",
        "initTextarea",
        "updateTextarea"
      ],
      valueTrackerContractId: "textarea-value-tracker",
      trackedField: "value"
    }
  ]);
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

function controlledUnsupported(hostTag, propName, props = {}) {
  const privateWrapperGateRecord =
    createExpectedPrivateWrapperGateRecordOrNull(hostTag, propName, props);

  return unsupported(
    propName,
    `controlled-${hostTag}`,
    `controlled ${hostTag} props are handled by the controlled form wrapper path`,
    {
      controlledFormBoundary: {
        propertyPayloadStatus: CONTROLLED_FORM_PROPERTY_PAYLOAD_STATUS,
        privateWrapperGateStatus:
          privateWrapperGateRecord === null
            ? null
            : CONTROLLED_PRIVATE_WRAPPER_PROPERTY_PAYLOAD_STATUS,
        privateWrapperGateRecord,
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

function createExpectedPrivateWrapperGateRecordOrNull(
  hostTag,
  propName,
  props
) {
  if (hostTag !== "input" && hostTag !== "select" && hostTag !== "textarea") {
    return null;
  }

  return resourceFormGate.createControlledInputPrivateWrapperPropertyPayloadRecord(
    {
      hostTag,
      propName,
      props
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
