export const REACT_DOM_HYDRATION_MARKER_ORACLE_ARTIFACT_PATH =
  "oracles/react-19.2.6-react-dom-hydration-marker-oracle.json";

export const REACT_DOM_HYDRATION_MARKER_RUNTIME_INVENTORY_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const REACT_DOM_HYDRATION_MARKER_TARGET = {
  packageName: "react-dom",
  version: "19.2.6",
  role: "official-react-dom-hydration-marker-target"
};

export const REACT_DOM_HYDRATION_MARKER_REACT_SOURCE = {
  repository: "facebook/react",
  tag: "v19.2.6",
  tagObject: "2fcbe419ed90f863e6f67ce5b9738f38dbec640b",
  commit: "eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401"
};

export const REACT_DOM_HYDRATION_MARKER_SOURCE_FILES = [
  {
    id: "react-fiber-config-dom",
    path: "packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js",
    role:
      "client DOM hydration host marker constants, marker traversal, form markers, and dev warning hooks"
  },
  {
    id: "react-fizz-config-dom",
    path: "packages/react-dom-bindings/src/server/ReactFizzConfigDOM.js",
    role:
      "server DOM Fizz marker bytes, boundary/segment/template prefixes, preamble markers, and external runtime data templates"
  },
  {
    id: "react-fiber-hydration-context",
    path: "packages/react-reconciler/src/ReactFiberHydrationContext.js",
    role:
      "hydration mismatch exception, recoverable error queueing, and dev-only mismatch warning contracts"
  },
  {
    id: "react-dom-fizz-inline-runtime",
    path:
      "packages/react-dom-bindings/src/server/fizz-instruction-set/ReactDOMFizzInstructionSetInlineCodeStrings.js",
    role:
      "inline Fizz runtime mutations for completed, queued, and client-rendered Suspense boundaries plus form replay"
  }
];

export const REACT_DOM_HYDRATION_MARKER_PINNED_SOURCE_EXPECTATIONS = {
  "react-fiber-config-dom": {
    sha256: "15f10be941c9a1aa5f593ddc1bedac9fd22554294653dc7dc839c3fcce8832f7",
    lineCount: 6403
  },
  "react-fizz-config-dom": {
    sha256: "1f196f0c944c1441c5b042ef14ba05ec165f1c9b5e4686db686326576f7b58db",
    lineCount: 7150
  },
  "react-fiber-hydration-context": {
    sha256: "023d49e2c530fc68e97aac0bc4e451e939a942946f133238b645aff7ce5fc75f",
    lineCount: 919
  },
  "react-dom-fizz-inline-runtime": {
    sha256: "0299dfd3283b25f9b88a8bd93330dbc7d12791fe5605983ca98fa6c8a0fba838",
    lineCount: 18
  }
};

export const REACT_DOM_HYDRATION_MARKER_SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-033-react-dom-inventory.md",
  "worker-progress/worker-042-react-dom-server-fizz-plan.md",
  "worker-progress/worker-043-react-dom-hydration-plan.md",
  REACT_DOM_HYDRATION_MARKER_RUNTIME_INVENTORY_PATH,
  ...REACT_DOM_HYDRATION_MARKER_SOURCE_FILES.map(
    (sourceFile) =>
      `https://raw.githubusercontent.com/${REACT_DOM_HYDRATION_MARKER_REACT_SOURCE.repository}/${REACT_DOM_HYDRATION_MARKER_REACT_SOURCE.commit}/${sourceFile.path}`
  )
];

export const REACT_DOM_HYDRATION_MARKER_WORKER_INPUTS = [
  {
    id: "worker-033-react-dom-inventory",
    path: "worker-progress/worker-033-react-dom-inventory.md",
    requiredPhrases: [
      "hydrateRoot",
      "Fizz",
      "Suspense markers",
      "form markers"
    ]
  },
  {
    id: "worker-042-react-dom-server-fizz-plan",
    path: "worker-progress/worker-042-react-dom-server-fizz-plan.md",
    requiredPhrases: [
      "Completed Suspense",
      "Pending Suspense start",
      "Client-rendered Suspense start",
      "Form state markers"
    ]
  },
  {
    id: "worker-043-react-dom-hydration-plan",
    path: "worker-progress/worker-043-react-dom-hydration-plan.md",
    requiredPhrases: [
      "Fizz marker compatibility contract",
      "Hydration failed",
      "FORM_STATE",
      "unstable_scheduleHydration"
    ]
  }
];

export const REACT_DOM_HYDRATION_MARKER_WORKER_RECONCILIATION = {
  id: "worker-042-043-marker-hydration-reconciliation",
  sourceWorkerIds: [
    "worker-033-react-dom-inventory",
    "worker-042-react-dom-server-fizz-plan",
    "worker-043-react-dom-hydration-plan"
  ],
  contract:
    "Worker 042 server/Fizz marker evidence and worker 043 client hydration contract evidence are co-recorded here and checked against pinned React source, resolving worker 043's earlier note that worker 042 was unavailable during that report.",
  compatibilityClaimed: false
};

export const REACT_DOM_HYDRATION_MARKER_CLIENT_COMMENT_CONSTANTS = {
  ACTIVITY_START_DATA: "&",
  ACTIVITY_END_DATA: "/&",
  SUSPENSE_START_DATA: "$",
  SUSPENSE_END_DATA: "/$",
  SUSPENSE_PENDING_START_DATA: "$?",
  SUSPENSE_QUEUED_START_DATA: "$~",
  SUSPENSE_FALLBACK_START_DATA: "$!",
  PREAMBLE_CONTRIBUTION_HTML: "html",
  PREAMBLE_CONTRIBUTION_BODY: "body",
  PREAMBLE_CONTRIBUTION_HEAD: "head",
  FORM_STATE_IS_MATCHING: "F!",
  FORM_STATE_IS_NOT_MATCHING: "F"
};

export const REACT_DOM_HYDRATION_MARKER_SERVER_CHUNKS = {
  formStateMarkerIsMatching: "<!--F!-->",
  formStateMarkerIsNotMatching: "<!--F-->",
  headPreambleContributionChunk: "<!--head-->",
  bodyPreambleContributionChunk: "<!--body-->",
  htmlPreambleContributionChunk: "<!--html-->",
  placeholder1: "<template id=\"",
  placeholder2: "\"></template>",
  startActivityBoundary: "<!--&-->",
  endActivityBoundary: "<!--/&-->",
  startCompletedSuspenseBoundary: "<!--$-->",
  startPendingSuspenseBoundary1: "<!--$?--><template id=\"",
  startPendingSuspenseBoundary2: "\"></template>",
  startClientRenderedSuspenseBoundary: "<!--$!-->",
  endSuspenseBoundary: "<!--/$-->",
  clientRenderedSuspenseBoundaryError1A: " data-dgst=\"",
  clientRenderedSuspenseBoundaryError1B: " data-msg=\"",
  clientRenderedSuspenseBoundaryError1C: " data-stck=\"",
  clientRenderedSuspenseBoundaryError1D: " data-cstck=\"",
  completeSegmentData1: "<template data-rsi=\"\" data-sid=\"",
  completeSegmentData2: "\" data-pid=\"",
  completeBoundaryData1: "<template data-rci=\"\" data-bid=\"",
  completeBoundaryWithStylesData1: "<template data-rri=\"\" data-bid=\"",
  completeBoundaryData2: "\" data-sid=\"",
  completeBoundaryData3a: "\" data-sty=\"",
  clientRenderData1: "<template data-rxi=\"\" data-bid=\"",
  clientRenderData2: "\" data-dgst=\"",
  clientRenderData3: "\" data-msg=\"",
  clientRenderData4: "\" data-stck=\"",
  clientRenderData5: "\" data-cstck=\""
};

export const REACT_DOM_HYDRATION_MARKER_RENDER_STATE_PREFIXES = {
  placeholderPrefix: "P:",
  segmentPrefix: "S:",
  boundaryPrefix: "B:"
};

export const REACT_DOM_HYDRATION_MARKER_INLINE_RUNTIME_SNIPPETS = {
  clientRenderBoundary: [
    "$RX=function",
    "b.data=\"$!\"",
    "a.dgst=c",
    "a.msg=d",
    "a.stck=e",
    "a.cstck=f",
    "b._reactRetry&&b._reactRetry()"
  ],
  completeBoundary: [
    "$RB=[]",
    "$RV=function",
    "\"$~\"",
    "g.data=\"$\"",
    "$RC=function",
    "requestAnimationFrame(g._reactRetry)"
  ],
  completeBoundaryWithStyles: [
    "$RR=function",
    "$RM=new Map",
    "data-precedence",
    "p.previousSibling.data=",
    "Promise.all(b).then($RC.bind(null,n,w),$RX.bind(null,n,\"CSS failed to load\"))"
  ],
  completeSegment: [
    "$RS=function",
    "a.parentNode.removeChild(a)",
    "b.parentNode.insertBefore(a.firstChild,b)",
    "b.parentNode.removeChild(b)"
  ],
  formReplaying: [
    "$$reactFormReplay",
    "FormData(c)",
    "javascript:throw new Error(\\'React form unexpectedly submitted.\\')"
  ]
};

export const REACT_DOM_HYDRATION_MARKER_PUBLISHED_BUNDLE_SNIPPETS = {
  "cjs/react-dom-client.development.js": [
    "Hydration failed because the server rendered ",
    "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up.",
    "ACTIVITY_START_DATA = \"&\"",
    "SUSPENSE_QUEUED_START_DATA = \"$~\"",
    "FORM_STATE_IS_MATCHING = \"F!\""
  ],
  "cjs/react-dom-server.node.development.js": [
    "\\x3c!--$--\\x3e",
    "\\x3c!--$?--\\x3e<template id=\"",
    "\\x3c!--$!--\\x3e",
    "\\x3c!--/$--\\x3e",
    "\\x3c!--F!--\\x3e",
    "data-dgst=\"",
    "data-cstck=\""
  ]
};

export const REACT_DOM_HYDRATION_MARKER_CONTRACTS = [
  {
    id: "activity-start",
    area: "Activity boundary",
    serializedMarker: "<!--&-->",
    commentData: "&",
    companionNode: null,
    lifecycle: "server-emitted-client-consumed",
    contract:
      "Client hydration claims this comment as a dehydrated Activity boundary start."
  },
  {
    id: "activity-end",
    area: "Activity boundary",
    serializedMarker: "<!--/&-->",
    commentData: "/&",
    companionNode: null,
    lifecycle: "server-emitted-client-consumed",
    contract:
      "Client boundary traversal treats this comment as the end of an Activity boundary."
  },
  {
    id: "suspense-completed-start",
    area: "Suspense boundary",
    serializedMarker: "<!--$-->",
    commentData: "$",
    companionNode: null,
    lifecycle: "server-emitted-client-consumed",
    contract:
      "Client hydration claims this comment as a Suspense boundary whose content is available."
  },
  {
    id: "suspense-pending-start",
    area: "Suspense boundary",
    serializedMarker: "<!--$?--><template id=\"{identifierPrefix}B:{hex}\"></template>",
    commentData: "$?",
    companionNode: "template placeholder with boundary id",
    lifecycle: "server-emitted-client-consumed-runtime-mutable",
    contract:
      "Client hydration treats this as pending; Fizz runtime completion can later queue or reveal it."
  },
  {
    id: "suspense-queued-start",
    area: "Suspense boundary",
    serializedMarker: null,
    commentData: "$~",
    companionNode: "existing pending boundary template",
    lifecycle: "runtime-mutated-client-consumed",
    contract:
      "Fizz runtime mutates a pending boundary comment to queued while completed content waits for reveal."
  },
  {
    id: "suspense-client-rendered-start",
    area: "Suspense boundary",
    serializedMarker: "<!--$!--><template data-dgst=\"...\" data-msg=\"...\" data-stck=\"...\" data-cstck=\"...\"></template>",
    commentData: "$!",
    companionNode: "template carrying optional error digest/message/stack/component-stack attributes",
    lifecycle: "server-emitted-or-runtime-mutated-client-consumed",
    contract:
      "Client hydration treats this boundary as client-rendered/fallback and can read adjacent template error evidence."
  },
  {
    id: "suspense-end",
    area: "Suspense boundary",
    serializedMarker: "<!--/$-->",
    commentData: "/$",
    companionNode: null,
    lifecycle: "server-emitted-client-consumed",
    contract:
      "Client traversal and clear/hide operations use this marker to terminate Suspense boundary depth."
  },
  {
    id: "form-state-matching",
    area: "Form state",
    serializedMarker: "<!--F!-->",
    commentData: "F!",
    companionNode: null,
    lifecycle: "server-emitted-client-consumed",
    contract:
      "Hydration consumes this form marker as matching the root formState passed to hydrateRoot."
  },
  {
    id: "form-state-not-matching",
    area: "Form state",
    serializedMarker: "<!--F-->",
    commentData: "F",
    companionNode: null,
    lifecycle: "server-emitted-client-consumed",
    contract:
      "Hydration consumes this form marker as not matching the hydrateRoot formState."
  },
  {
    id: "preamble-html-contribution",
    area: "Preamble cleanup",
    serializedMarker: "<!--html-->",
    commentData: "html",
    companionNode: null,
    lifecycle: "server-emitted-client-boundary-clear-consumed",
    contract:
      "Boundary clearing treats this marker as evidence that html singleton state contributed to the boundary."
  },
  {
    id: "preamble-head-contribution",
    area: "Preamble cleanup",
    serializedMarker: "<!--head-->",
    commentData: "head",
    companionNode: null,
    lifecycle: "server-emitted-client-boundary-clear-consumed",
    contract:
      "Boundary clearing treats this marker as evidence that head singleton state contributed to the boundary."
  },
  {
    id: "preamble-body-contribution",
    area: "Preamble cleanup",
    serializedMarker: "<!--body-->",
    commentData: "body",
    companionNode: null,
    lifecycle: "server-emitted-client-boundary-clear-consumed",
    contract:
      "Boundary clearing treats this marker as evidence that body singleton state contributed to the boundary."
  },
  {
    id: "segment-placeholder",
    area: "Fizz segment movement",
    serializedMarker: "<template id=\"{identifierPrefix}P:{hex}\"></template>",
    commentData: null,
    companionNode: "template placeholder",
    lifecycle: "server-emitted-runtime-consumed",
    contract:
      "Fizz completed-segment instructions move segment children into this placeholder location."
  },
  {
    id: "external-runtime-complete-segment",
    area: "Fizz external runtime",
    serializedMarker: "<template data-rsi=\"\" data-sid=\"{identifierPrefix}S:{hex}\" data-pid=\"{identifierPrefix}P:{hex}\"></template>",
    commentData: null,
    companionNode: "template carrying segment and placeholder ids",
    lifecycle: "server-emitted-runtime-consumed",
    contract:
      "External data streaming uses template data attributes for completed segment insertion instead of inline script calls."
  },
  {
    id: "external-runtime-complete-boundary",
    area: "Fizz external runtime",
    serializedMarker: "<template data-rci=\"\" data-bid=\"{identifierPrefix}B:{hex}\" data-sid=\"{identifierPrefix}S:{hex}\"></template>",
    commentData: null,
    companionNode: "template carrying boundary and segment ids",
    lifecycle: "server-emitted-runtime-consumed",
    contract:
      "External data streaming uses template data attributes for completed boundary replacement."
  },
  {
    id: "external-runtime-complete-boundary-with-styles",
    area: "Fizz external runtime",
    serializedMarker: "<template data-rri=\"\" data-bid=\"{identifierPrefix}B:{hex}\" data-sid=\"{identifierPrefix}S:{hex}\" data-sty=\"...\"></template>",
    commentData: null,
    companionNode:
      "template carrying boundary id, segment id, and serialized style/resource precedence data",
    lifecycle: "server-emitted-runtime-consumed",
    contract:
      "External data streaming uses template data attributes for completed boundary replacement that must coordinate stylesheet precedence before reveal."
  },
  {
    id: "external-runtime-client-render-boundary",
    area: "Fizz external runtime",
    serializedMarker: "<template data-rxi=\"\" data-bid=\"{identifierPrefix}B:{hex}\" data-dgst=\"...\" data-msg=\"...\" data-stck=\"...\" data-cstck=\"...\"></template>",
    commentData: null,
    companionNode: "template carrying boundary id and optional error evidence",
    lifecycle: "server-emitted-runtime-consumed",
    contract:
      "External data streaming uses template data attributes to mark a boundary as client-rendered."
  }
];

export const REACT_DOM_HYDRATION_MARKER_MISMATCH_CONTRACTS = [
  {
    id: "fatal-html-mismatch",
    sourceFunction: "throwOnHydrationMismatch",
    trigger: "host element, boundary, form marker, or unhydrated-tail mismatch",
    errorMessagePrefix:
      "Hydration failed because the server rendered HTML didn't match the client.",
    delivery:
      "queueHydrationError records the captured error, then React throws the internal HydrationMismatchException sentinel.",
    fastReactContract:
      "Represent as structured mismatch evidence and recoverable-error queue data, not a string-only console warning."
  },
  {
    id: "fatal-text-mismatch",
    sourceFunction: "throwOnHydrationMismatch",
    trigger: "text hydration mismatch",
    errorMessagePrefix:
      "Hydration failed because the server rendered text didn't match the client.",
    delivery:
      "queueHydrationError records the captured error, then React throws the internal HydrationMismatchException sentinel.",
    fastReactContract:
      "Text and HTML mismatch classes stay distinct because React emits different fatal error text."
  },
  {
    id: "internal-hydration-mismatch-exception",
    sourceFunction: "HydrationMismatchException",
    trigger: "internal control-flow sentinel after queueing the public mismatch error",
    errorMessagePrefix:
      "Hydration Mismatch Exception: This is not a real error, and should not leak into userspace.",
    delivery: "internal throw only",
    fastReactContract:
      "Do not expose the sentinel as the user-facing recoverable error."
  },
  {
    id: "dev-successful-hydration-warning",
    sourceFunction: "emitPendingHydrationWarnings",
    trigger:
      "development-only props/text differences that did not force client rendering",
    errorMessagePrefix:
      "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up.",
    delivery: "console.error after successful hydration in development",
    fastReactContract:
      "Keep fatal mismatch errors separate from successful-hydration dev warnings."
  },
  {
    id: "suppress-hydration-warning-text-diff",
    sourceFunction: "diffHydratedTextForDevWarnings",
    trigger:
      "parent props include suppressHydrationWarning: true for text diff warnings",
    errorMessagePrefix: null,
    delivery: "returns null dev-warning diff",
    fastReactContract:
      "Suppression affects dev warning diff collection; it is not a blanket marker parser bypass."
  },
  {
    id: "form-marker-mismatch",
    sourceFunction: "tryToClaimNextHydratableFormMarkerInstance",
    trigger: "no matching F!/F form marker is found during form state hydration",
    errorMessagePrefix:
      "Hydration failed because the server rendered HTML didn't match the client.",
    delivery: "falls through to throwOnHydrationMismatch",
    fastReactContract:
      "Form markers must be typed hydratable comments and mismatches must join the same fatal mismatch path."
  }
];
