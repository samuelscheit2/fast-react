export const REACT_DOM_SERVER_STATIC_SCENARIOS = [
  {
    id: "server-static-export-shape",
    area: "Server and static export behavior",
    entrypoints: [
      "react-dom/server",
      "react-dom/server.node",
      "react-dom/server.browser",
      "react-dom/server.edge",
      "react-dom/server.bun",
      "react-dom/static",
      "react-dom/static.node",
      "react-dom/static.browser",
      "react-dom/static.edge"
    ],
    captures: [
      "export key order",
      "own key order",
      "data descriptors",
      "function names and arities",
      "version values",
      "server.bun resume undefined caveat",
      "react-server condition throwing modules"
    ]
  },
  {
    id: "server-legacy-markup",
    area: "Legacy server markup wrappers",
    entrypoints: [
      "react-dom/server",
      "react-dom/server.node",
      "react-dom/server.browser",
      "react-dom/server.edge",
      "react-dom/server.bun"
    ],
    captures: [
      "renderToString simple DOM output",
      "renderToStaticMarkup simple DOM output",
      "HTML text and attribute escaping",
      "legacy Fizz wrapper availability across server variants"
    ]
  },
  {
    id: "server-fizz-suspense-markers",
    area: "Explicit deferred Fizz Suspense marker behavior",
    entrypoints: [
      "react-dom/server",
      "react-dom/server.node",
      "react-dom/server.browser",
      "react-dom/server.edge",
      "react-dom/server.bun"
    ],
    captures: [
      "renderToString pending Suspense fallback output",
      "client-rendered Suspense marker presence",
      "template diagnostic attributes",
      "renderToStaticMarkup marker suppression"
    ]
  },
  {
    id: "server-stream-result-shape",
    area: "Basic server stream shape evidence",
    entrypoints: [
      "react-dom/server",
      "react-dom/server.node",
      "react-dom/server.browser",
      "react-dom/server.edge",
      "react-dom/server.bun"
    ],
    captures: [
      "renderToPipeableStream return object shape",
      "pipe output for simple markup",
      "second pipe error boundary",
      "renderToReadableStream promise and stream shape",
      "ReadableStream allReady promise",
      "Web stream output for simple markup"
    ]
  },
  {
    id: "static-prerender-result-shape",
    area: "Basic static prerender shape evidence",
    entrypoints: [
      "react-dom/static",
      "react-dom/static.node",
      "react-dom/static.browser",
      "react-dom/static.edge"
    ],
    captures: [
      "prerender promise result keys",
      "ReadableStream prelude output",
      "postponed null shape for completed simple markup",
      "prerenderToNodeStream Node stream result shape"
    ]
  },
  {
    id: "server-static-error-shape",
    area: "Basic server/static error shape evidence",
    entrypoints: [
      "react-dom/server",
      "react-dom/server.node",
      "react-dom/server.browser",
      "react-dom/server.edge",
      "react-dom/server.bun",
      "react-dom/static",
      "react-dom/static.node",
      "react-dom/static.browser",
      "react-dom/static.edge"
    ],
    captures: [
      "renderToString component throw behavior",
      "renderToReadableStream shell rejection shape",
      "static prerender shell rejection shape",
      "callback error summaries without stack paths"
    ]
  },
  {
    id: "server-static-resume-deferred-boundary",
    area: "Explicit deferred Fizz resume behavior",
    entrypoints: [
      "react-dom/server",
      "react-dom/server.node",
      "react-dom/server.browser",
      "react-dom/server.edge",
      "react-dom/server.bun",
      "react-dom/static",
      "react-dom/static.node",
      "react-dom/static.browser",
      "react-dom/static.edge"
    ],
    captures: [
      "resume invalid postponed-state handling",
      "resumeToPipeableStream invalid postponed-state handling",
      "resumeAndPrerender invalid postponed-state handling",
      "resumeAndPrerenderToNodeStream invalid postponed-state handling",
      "Fast React placeholder boundaries for deferred Fizz work"
    ]
  }
];

export const REACT_DOM_SERVER_STATIC_SCENARIO_IDS =
  REACT_DOM_SERVER_STATIC_SCENARIOS.map((scenario) => scenario.id);
