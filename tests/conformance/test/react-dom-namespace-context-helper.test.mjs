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

const domContainer = require(
  path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
);
const domHostContext = require(
  path.join(repoRoot, "packages/react-dom/src/client/dom-host-context.js")
);
const domNamespaces = require(
  path.join(repoRoot, "packages/react-dom/src/client/dom-namespaces.js")
);
const reactDom = require(path.join(repoRoot, "packages/react-dom/index.js"));
const reactDomClient = require(
  path.join(repoRoot, "packages/react-dom/client.js")
);
const reactDomPackageJson = require(
  path.join(repoRoot, "packages/react-dom/package.json")
);

const {
  DOCUMENT_FRAGMENT_NODE,
  DOCUMENT_NODE,
  ELEMENT_NODE
} = domContainer;
const {
  HTML_NAMESPACE,
  MATH_NAMESPACE,
  SVG_NAMESPACE,
  getChildDOMNamespace,
  getDOMElementNamespace,
  normalizeDOMNamespace
} = domNamespaces;
const {
  createDOMElement,
  createDOMHostContext,
  createRootDOMHostContext,
  domHostContextErrorCode,
  getChildDOMHostContext,
  getOwnerDocumentFromDOMContainer,
  getRootDOMNamespace
} = domHostContext;

test("private DOM namespace helpers model HTML, SVG, MathML, and foreignObject transitions", () => {
  assert.equal(normalizeDOMNamespace(undefined), HTML_NAMESPACE);
  assert.equal(
    normalizeDOMNamespace("urn:unknown-private-namespace"),
    HTML_NAMESPACE
  );
  assert.equal(normalizeDOMNamespace(SVG_NAMESPACE), SVG_NAMESPACE);
  assert.equal(normalizeDOMNamespace(MATH_NAMESPACE), MATH_NAMESPACE);

  assert.equal(getDOMElementNamespace(HTML_NAMESPACE, "div"), HTML_NAMESPACE);
  assert.equal(getDOMElementNamespace(HTML_NAMESPACE, "svg"), SVG_NAMESPACE);
  assert.equal(getDOMElementNamespace(HTML_NAMESPACE, "math"), MATH_NAMESPACE);
  assert.equal(getDOMElementNamespace(SVG_NAMESPACE, "foreignObject"), SVG_NAMESPACE);
  assert.equal(getDOMElementNamespace(MATH_NAMESPACE, "svg"), MATH_NAMESPACE);

  assert.equal(getChildDOMNamespace(HTML_NAMESPACE, "div"), HTML_NAMESPACE);
  assert.equal(getChildDOMNamespace(HTML_NAMESPACE, "svg"), SVG_NAMESPACE);
  assert.equal(getChildDOMNamespace(HTML_NAMESPACE, "math"), MATH_NAMESPACE);
  assert.equal(getChildDOMNamespace(SVG_NAMESPACE, "g"), SVG_NAMESPACE);
  assert.equal(getChildDOMNamespace(SVG_NAMESPACE, "foreignObject"), HTML_NAMESPACE);
  assert.equal(getChildDOMNamespace(MATH_NAMESPACE, "mi"), MATH_NAMESPACE);
  assert.equal(getChildDOMNamespace(MATH_NAMESPACE, "svg"), MATH_NAMESPACE);
});

test("private DOM root host context carries ownerDocument and container child namespace", () => {
  const document = createRecordingDocument("root-context");
  const div = createContainer("DIV", HTML_NAMESPACE, document);
  const svg = createContainer("svg", SVG_NAMESPACE, document);
  const math = createContainer("math", MATH_NAMESPACE, document);
  const foreignObject = createContainer("foreignObject", SVG_NAMESPACE, document);
  const fragment = {
    nodeName: "#document-fragment",
    nodeType: DOCUMENT_FRAGMENT_NODE,
    ownerDocument: document
  };

  assert.equal(getOwnerDocumentFromDOMContainer(div), document);
  assert.equal(getOwnerDocumentFromDOMContainer(document), document);
  assert.equal(getRootDOMNamespace(div), HTML_NAMESPACE);
  assert.equal(getRootDOMNamespace(svg), SVG_NAMESPACE);
  assert.equal(getRootDOMNamespace(math), MATH_NAMESPACE);
  assert.equal(getRootDOMNamespace(foreignObject), HTML_NAMESPACE);
  assert.equal(getRootDOMNamespace(fragment), HTML_NAMESPACE);

  const divContext = createRootDOMHostContext(div);
  assert.equal(divContext.ownerDocument, document);
  assert.equal(divContext.namespaceURI, HTML_NAMESPACE);

  const svgContext = createRootDOMHostContext(svg);
  assert.equal(svgContext.ownerDocument, document);
  assert.equal(svgContext.namespaceURI, SVG_NAMESPACE);

  const documentWithSvgRoot = createRecordingDocument("svg-document");
  documentWithSvgRoot.documentElement = createContainer(
    "svg",
    SVG_NAMESPACE,
    documentWithSvgRoot
  );
  const documentContext = createRootDOMHostContext(documentWithSvgRoot);
  assert.equal(documentContext.ownerDocument, documentWithSvgRoot);
  assert.equal(documentContext.namespaceURI, SVG_NAMESPACE);
});

test("private DOM creation helper selects createElement versus createElementNS from context", () => {
  const document = createRecordingDocument("creation");
  const htmlContext = createDOMHostContext(document, HTML_NAMESPACE);

  const div = createDOMElement("div", htmlContext);
  const svg = createDOMElement("svg", htmlContext);
  const svgContext = getChildDOMHostContext(htmlContext, "svg");
  assert.equal(getChildDOMHostContext(svgContext, "g"), svgContext);
  const foreignObject = createDOMElement("foreignObject", svgContext);
  const foreignObjectChildContext = getChildDOMHostContext(
    svgContext,
    "foreignObject"
  );
  assert.notEqual(foreignObjectChildContext, svgContext);
  const htmlDiv = createDOMElement("div", foreignObjectChildContext);
  const nestedSvg = createDOMElement("svg", foreignObjectChildContext);
  const nestedSvgContext = getChildDOMHostContext(
    foreignObjectChildContext,
    "svg"
  );
  const circle = createDOMElement("circle", nestedSvgContext);
  const math = createDOMElement("math", htmlContext);
  const mathContext = getChildDOMHostContext(htmlContext, "math");
  const mi = createDOMElement("mi", mathContext);
  const svgInsideMath = createDOMElement("svg", mathContext);

  assert.deepEqual(
    document.operations.map(({ type, namespaceURI, name }) => ({
      type,
      namespaceURI,
      name
    })),
    [
      { type: "createElement", namespaceURI: HTML_NAMESPACE, name: "div" },
      { type: "createElementNS", namespaceURI: SVG_NAMESPACE, name: "svg" },
      {
        type: "createElementNS",
        namespaceURI: SVG_NAMESPACE,
        name: "foreignObject"
      },
      { type: "createElement", namespaceURI: HTML_NAMESPACE, name: "div" },
      { type: "createElementNS", namespaceURI: SVG_NAMESPACE, name: "svg" },
      { type: "createElementNS", namespaceURI: SVG_NAMESPACE, name: "circle" },
      { type: "createElementNS", namespaceURI: MATH_NAMESPACE, name: "math" },
      { type: "createElementNS", namespaceURI: MATH_NAMESPACE, name: "mi" },
      { type: "createElementNS", namespaceURI: MATH_NAMESPACE, name: "svg" }
    ]
  );

  assert.equal(div.ownerDocument, document);
  assert.equal(svg.namespaceURI, SVG_NAMESPACE);
  assert.equal(foreignObject.namespaceURI, SVG_NAMESPACE);
  assert.equal(htmlDiv.namespaceURI, HTML_NAMESPACE);
  assert.equal(nestedSvg.namespaceURI, SVG_NAMESPACE);
  assert.equal(circle.namespaceURI, SVG_NAMESPACE);
  assert.equal(math.namespaceURI, MATH_NAMESPACE);
  assert.equal(mi.namespaceURI, MATH_NAMESPACE);
  assert.equal(svgInsideMath.namespaceURI, MATH_NAMESPACE);
});

test("private DOM host context helper rejects missing owner document wiring", () => {
  assert.throws(
    () => createDOMHostContext(null, HTML_NAMESPACE),
    {
      code: domHostContextErrorCode,
      name: "FastReactDomHostContextError"
    }
  );
  assert.throws(
    () => createDOMElement("div", {}),
    {
      code: domHostContextErrorCode,
      name: "FastReactDomHostContextError"
    }
  );
});

test("private DOM namespace helper does not change public React DOM exports", () => {
  assert.deepEqual(Object.keys(reactDomClient), [
    "createRoot",
    "hydrateRoot",
    "version"
  ]);
  assert.equal(reactDom.__FAST_REACT_PLACEHOLDER__, true);
  assert.equal(reactDomClient.__FAST_REACT_PLACEHOLDER__, true);

  const exportedSubpaths = Object.keys(reactDomPackageJson.exports);
  assert.equal(exportedSubpaths.includes("./src/client/dom-host-context"), false);
  assert.equal(exportedSubpaths.includes("./src/client/dom-namespaces"), false);
});

function createRecordingDocument(label) {
  const document = {
    label,
    nodeName: "#document",
    nodeType: DOCUMENT_NODE,
    operations: [],
    createElement(name) {
      this.operations.push({
        name,
        namespaceURI: HTML_NAMESPACE,
        type: "createElement"
      });
      return createCreatedNode(name, HTML_NAMESPACE, this, "createElement");
    },
    createElementNS(namespaceURI, name) {
      this.operations.push({
        name,
        namespaceURI,
        type: "createElementNS"
      });
      return createCreatedNode(name, namespaceURI, this, "createElementNS");
    }
  };
  document.ownerDocument = document;
  document.documentElement = createContainer("HTML", HTML_NAMESPACE, document);
  return document;
}

function createContainer(nodeName, namespaceURI, ownerDocument) {
  return {
    localName: nodeName,
    namespaceURI,
    nodeName,
    nodeType: ELEMENT_NODE,
    ownerDocument,
    tagName: nodeName
  };
}

function createCreatedNode(nodeName, namespaceURI, ownerDocument, createdWith) {
  return {
    createdWith,
    namespaceURI,
    nodeName,
    nodeType: ELEMENT_NODE,
    ownerDocument
  };
}
