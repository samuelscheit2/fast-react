import { createRequire } from "node:module";
import { PassThrough } from "node:stream";
import { TextDecoder } from "node:util";

const require = createRequire(import.meta.url);
const targetPackage = process.argv[2];
const scenarioId = process.argv[3];

if (!targetPackage || !scenarioId) {
  throw new Error(
    "Usage: node react-dom-server-static-probe-runner.mjs <package> <scenario>"
  );
}

const consoleCalls = [];
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  consoleCalls.push({
    method: "error",
    args: args.map((arg) => describeValue(arg))
  });
};
console.warn = (...args) => {
  consoleCalls.push({
    method: "warn",
    args: args.map((arg) => describeValue(arg))
  });
};

const SERVER_SUBPATHS = [
  "./server",
  "./server.node",
  "./server.browser",
  "./server.edge",
  "./server.bun"
];

const STATIC_SUBPATHS = [
  "./static",
  "./static.node",
  "./static.browser",
  "./static.edge"
];

const RUNTIME_SUBPATHS = [...SERVER_SUBPATHS, ...STATIC_SUBPATHS];
const NODE_SERVER_SUBPATHS = ["./server", "./server.node"];
const NODE_STATIC_SUBPATHS = ["./static", "./static.node"];

async function main() {
  try {
    const scenario = scenarios[scenarioId];
    if (!scenario) {
      throw new Error(`Unknown React DOM server/static scenario: ${scenarioId}`);
    }

    const result = await captureOperation(scenarioId, () =>
      scenario(targetPackage)
    );
    writeProbeResultAndExit({
      targetPackage,
      scenarioId,
      result,
      consoleCalls
    });
  } finally {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
}

const scenarios = {
  "server-static-export-shape": async (target) => ({
    subpaths: await Promise.all(
      RUNTIME_SUBPATHS.map(async (subpath) => ({
        subpath,
        require: await captureOperation(`require ${subpath}`, () => {
          const moduleExports = require(packageSpecifier(target, subpath));
          return describeModuleExports(moduleExports);
        })
      }))
    )
  }),

  "server-legacy-markup": async (target) => ({
    subpaths: await Promise.all(
      SERVER_SUBPATHS.map(async (subpath) => {
        const load = loadEntrypoint(target, subpath);
        if (load.status !== "ok") {
          return { subpath, load };
        }

        const React = loadPeerReact(target);
        const element = createSimpleMarkupElement(React);
        const moduleExports = load.value;

        return {
          subpath,
          load: summarizeLoadedEntrypoint(moduleExports),
          renderToString: await captureOperation("renderToString", () =>
            summarizeMarkupText(
              moduleExports.renderToString(element, {
                identifierPrefix: "srv-"
              })
            )
          ),
          renderToStaticMarkup: await captureOperation(
            "renderToStaticMarkup",
            () =>
              summarizeMarkupText(
                moduleExports.renderToStaticMarkup(element, {
                  identifierPrefix: "srv-"
                })
              )
          )
        };
      })
    )
  }),

  "server-fizz-suspense-markers": async (target) => ({
    subpaths: await Promise.all(
      SERVER_SUBPATHS.map(async (subpath) => {
        const load = loadEntrypoint(target, subpath);
        if (load.status !== "ok") {
          return { subpath, load };
        }

        const React = loadPeerReact(target);
        const element = createPendingSuspenseElement(React);
        const moduleExports = load.value;

        return {
          subpath,
          load: summarizeLoadedEntrypoint(moduleExports),
          renderToString: await captureOperation("renderToString suspense", () =>
            summarizeMarkupText(
              moduleExports.renderToString(element, {
                identifierPrefix: "sus-"
              })
            )
          ),
          renderToStaticMarkup: await captureOperation(
            "renderToStaticMarkup suspense",
            () =>
              summarizeMarkupText(
                moduleExports.renderToStaticMarkup(element, {
                  identifierPrefix: "sus-"
                })
              )
          )
        };
      })
    )
  }),

  "server-stream-result-shape": async (target) => ({
    pipeable: await Promise.all(
      NODE_SERVER_SUBPATHS.map((subpath) =>
        captureSubpathOperation(target, subpath, async (moduleExports, React) => {
          if (typeof moduleExports.renderToPipeableStream !== "function") {
            return {
              renderToPipeableStream: describeValue(
                moduleExports.renderToPipeableStream
              )
            };
          }

          const events = [];
          const element = createSimpleStreamElement(React);
          const pipeable = moduleExports.renderToPipeableStream(element, {
            identifierPrefix: "pipe-",
            onShellReady() {
              events.push("onShellReady");
            },
            onAllReady() {
              events.push("onAllReady");
            },
            onError(error) {
              events.push({
                type: "onError",
                error: describeError(error)
              });
            }
          });

          const destination = new PassThrough();
          const outputPromise = readNodeStreamText(destination);
          const firstPipe = await captureOperation("first pipe", () =>
            describeValue(pipeable.pipe(destination))
          );
          const secondPipe = await captureOperation("second pipe", () => {
            const secondDestination = new PassThrough();
            const pipeReturn = pipeable.pipe(secondDestination);
            secondDestination.destroy();
            return describeValue(pipeReturn);
          });
          const output = await outputPromise;

          return {
            pipeableShape: describePipeableResult(pipeable),
            firstPipe,
            secondPipe,
            events,
            output: summarizeMarkupText(output)
          };
        })
      )
    ),
    readable: await Promise.all(
      SERVER_SUBPATHS.map((subpath) =>
        captureSubpathOperation(target, subpath, async (moduleExports, React) => {
          if (typeof moduleExports.renderToReadableStream !== "function") {
            return {
              renderToReadableStream: describeValue(
                moduleExports.renderToReadableStream
              )
            };
          }
          if (subpath === "./server.bun") {
            return {
              renderToReadableStream: describeValue(
                moduleExports.renderToReadableStream
              ),
              notExecutedInNode: true,
              reason:
                "The Bun server bundle creates a ReadableStream with source.type = 'direct', which is Bun runtime behavior and is rejected by Node."
            };
          }

          const events = [];
          const element = createSimpleStreamElement(React);
          const streamPromise = moduleExports.renderToReadableStream(element, {
            identifierPrefix: "read-",
            onError(error) {
              events.push({
                type: "onError",
                error: describeError(error)
              });
            }
          });
          const stream = await streamPromise;
          const allReady = await captureOperation("allReady", async () => {
            await stream.allReady;
            return "resolved";
          });
          const output = await readWebStreamText(stream);

          return {
            promiseShape: describeValue(streamPromise),
            streamShape: describeReadableStream(stream),
            allReadyDescriptor: describeDescriptor(
              Object.getOwnPropertyDescriptor(stream, "allReady")
            ),
            allReady,
            events,
            output: summarizeMarkupText(output)
          };
        })
      )
    )
  }),

  "static-prerender-result-shape": async (target) => ({
    prerender: await Promise.all(
      STATIC_SUBPATHS.map((subpath) =>
        captureSubpathOperation(target, subpath, async (moduleExports, React) => {
          if (typeof moduleExports.prerender !== "function") {
            return {
              prerender: describeValue(moduleExports.prerender)
            };
          }

          const result = await moduleExports.prerender(
            createSimpleStaticElement(React),
            {
              identifierPrefix: "pre-"
            }
          );
          return await describeStaticPrerenderResult(result, "web");
        })
      )
    ),
    prerenderToNodeStream: await Promise.all(
      NODE_STATIC_SUBPATHS.map((subpath) =>
        captureSubpathOperation(target, subpath, async (moduleExports, React) => {
          if (typeof moduleExports.prerenderToNodeStream !== "function") {
            return {
              prerenderToNodeStream: describeValue(
                moduleExports.prerenderToNodeStream
              )
            };
          }

          const result = await moduleExports.prerenderToNodeStream(
            createSimpleStaticElement(React),
            {
              identifierPrefix: "pre-node-"
            }
          );
          return await describeStaticPrerenderResult(result, "node");
        })
      )
    )
  }),

  "server-static-error-shape": async (target) => ({
    renderToString: await Promise.all(
      SERVER_SUBPATHS.map((subpath) =>
        captureSubpathOperation(target, subpath, async (moduleExports, React) => {
          if (typeof moduleExports.renderToString !== "function") {
            return {
              renderToString: describeValue(moduleExports.renderToString)
            };
          }

          return await captureOperation("renderToString throwing component", () =>
            moduleExports.renderToString(createThrowingElement(React))
          );
        })
      )
    ),
    renderToReadableStream: await Promise.all(
      SERVER_SUBPATHS.map((subpath) =>
        captureSubpathOperation(target, subpath, async (moduleExports, React) => {
          if (typeof moduleExports.renderToReadableStream !== "function") {
            return {
              renderToReadableStream: describeValue(
                moduleExports.renderToReadableStream
              )
            };
          }

          const events = [];
          const result = await captureOperation(
            "renderToReadableStream throwing component",
            async () => {
              const stream = await moduleExports.renderToReadableStream(
                createThrowingElement(React),
                {
                  onError(error) {
                    events.push(describeError(error));
                  }
                }
              );
              return describeReadableStream(stream);
            }
          );

          return { result, events };
        })
      )
    ),
    prerender: await Promise.all(
      STATIC_SUBPATHS.map((subpath) =>
        captureSubpathOperation(target, subpath, async (moduleExports, React) => {
          if (typeof moduleExports.prerender !== "function") {
            return {
              prerender: describeValue(moduleExports.prerender)
            };
          }

          const events = [];
          const result = await captureOperation(
            "prerender throwing component",
            async () => {
              const prerendered = await moduleExports.prerender(
                createThrowingElement(React),
                {
                  onError(error) {
                    events.push(describeError(error));
                  }
                }
              );
              return await describeStaticPrerenderResult(prerendered, "web");
            }
          );

          return { result, events };
        })
      )
    )
  }),

  "server-static-resume-deferred-boundary": async (target) => ({
    resume: await Promise.all(
      SERVER_SUBPATHS.map((subpath) =>
        captureSubpathOperation(target, subpath, async (moduleExports, React) => {
          if (typeof moduleExports.resume !== "function") {
            return {
              resume: describeValue(moduleExports.resume)
            };
          }

          return await captureOperation("resume null postponed state", async () => {
            const stream = await moduleExports.resume(
              createSimpleStreamElement(React),
              null
            );
            return describeReadableStream(stream);
          });
        })
      )
    ),
    resumeToPipeableStream: await Promise.all(
      NODE_SERVER_SUBPATHS.map((subpath) =>
        captureSubpathOperation(target, subpath, async (moduleExports, React) => {
          if (typeof moduleExports.resumeToPipeableStream !== "function") {
            return {
              resumeToPipeableStream: describeValue(
                moduleExports.resumeToPipeableStream
              )
            };
          }

          return await captureOperation(
            "resumeToPipeableStream null postponed state",
            () =>
              describePipeableResult(
                moduleExports.resumeToPipeableStream(
                  createSimpleStreamElement(React),
                  null
                )
              )
          );
        })
      )
    ),
    resumeAndPrerender: await Promise.all(
      STATIC_SUBPATHS.map((subpath) =>
        captureSubpathOperation(target, subpath, async (moduleExports, React) => {
          if (typeof moduleExports.resumeAndPrerender !== "function") {
            return {
              resumeAndPrerender: describeValue(
                moduleExports.resumeAndPrerender
              )
            };
          }

          return await captureOperation(
            "resumeAndPrerender null postponed state",
            async () => {
              const result = await moduleExports.resumeAndPrerender(
                createSimpleStaticElement(React),
                null
              );
              return await describeStaticPrerenderResult(result, "web");
            }
          );
        })
      )
    ),
    resumeAndPrerenderToNodeStream: await Promise.all(
      NODE_STATIC_SUBPATHS.map((subpath) =>
        captureSubpathOperation(target, subpath, async (moduleExports, React) => {
          if (
            typeof moduleExports.resumeAndPrerenderToNodeStream !== "function"
          ) {
            return {
              resumeAndPrerenderToNodeStream: describeValue(
                moduleExports.resumeAndPrerenderToNodeStream
              )
            };
          }

          return await captureOperation(
            "resumeAndPrerenderToNodeStream null postponed state",
            async () => {
              const result =
                await moduleExports.resumeAndPrerenderToNodeStream(
                  createSimpleStaticElement(React),
                  null
                );
              return await describeStaticPrerenderResult(result, "node");
            }
          );
        })
      )
    )
  })
};

function loadEntrypoint(target, subpath) {
  try {
    return {
      status: "ok",
      value: require(packageSpecifier(target, subpath))
    };
  } catch (error) {
    return {
      status: "throws",
      error: describeError(error)
    };
  }
}

async function captureSubpathOperation(target, subpath, operation) {
  const load = loadEntrypoint(target, subpath);
  if (load.status !== "ok") {
    return { subpath, load };
  }

  return {
    subpath,
    load: summarizeLoadedEntrypoint(load.value),
    operation: await captureOperation(`${subpath} operation`, () =>
      operation(load.value, loadPeerReact(target))
    )
  };
}

function summarizeLoadedEntrypoint(moduleExports) {
  return {
    status: "ok",
    exportKeys: Object.keys(moduleExports),
    placeholderMetadata: describePlaceholderMetadata(moduleExports)
  };
}

function describeModuleExports(moduleExports) {
  const ownKeys = Reflect.ownKeys(moduleExports).map(describeKey);
  const exportKeys = Object.keys(moduleExports);

  return {
    exportKeys,
    ownKeys,
    version: describeValue(moduleExports.version),
    placeholderMetadata: describePlaceholderMetadata(moduleExports),
    descriptors: exportKeys.map((key) => ({
      key,
      descriptor: describeDescriptor(
        Object.getOwnPropertyDescriptor(moduleExports, key)
      )
    }))
  };
}

function describePlaceholderMetadata(moduleExports) {
  return {
    isFastReactPlaceholder: moduleExports.__FAST_REACT_PLACEHOLDER__ === true,
    fastReactEntrypoint:
      typeof moduleExports.__FAST_REACT_ENTRYPOINT__ === "string"
        ? moduleExports.__FAST_REACT_ENTRYPOINT__
        : null,
    compatibilityTarget:
      typeof moduleExports.compatibilityTarget === "string"
        ? moduleExports.compatibilityTarget
        : null
  };
}

async function captureOperation(label, operation) {
  try {
    return {
      label,
      status: "ok",
      value: await operation()
    };
  } catch (error) {
    return {
      label,
      status: "throws",
      error: describeError(error)
    };
  }
}

function loadPeerReact(target) {
  if (target === "@fast-react/react-dom") {
    return require("@fast-react/react");
  }
  return require("react");
}

function packageSpecifier(target, subpath) {
  if (subpath === ".") {
    return target;
  }
  return `${target}/${subpath.slice(2)}`;
}

function createSimpleMarkupElement(React) {
  return React.createElement(
    "div",
    {
      id: "root",
      className: "greeting",
      title: "5 > 3 & \"yes\"",
      "data-mode": "server-static"
    },
    "Hello ",
    React.createElement("span", null, "Fizz"),
    " & static"
  );
}

function createSimpleStreamElement(React) {
  return React.createElement(
    "main",
    { id: "stream-root", "data-kind": "readable" },
    React.createElement("h1", null, "Stream"),
    React.createElement("p", null, "ready")
  );
}

function createSimpleStaticElement(React) {
  return React.createElement(
    "section",
    { id: "static-root", "data-kind": "prerender" },
    React.createElement("strong", null, "Static"),
    " prelude"
  );
}

function createPendingSuspenseElement(React) {
  function PendingThenable() {
    throw new Promise(() => {});
  }

  return React.createElement(
    React.Suspense,
    { fallback: React.createElement("em", null, "loading") },
    React.createElement(PendingThenable)
  );
}

function createThrowingElement(React) {
  function ServerStaticBoom() {
    const error = new Error("server-static boom");
    error.name = "ServerStaticBoomError";
    throw error;
  }

  return React.createElement(ServerStaticBoom);
}

function summarizeMarkupText(text) {
  return {
    text,
    length: text.length,
    commentData: [...text.matchAll(/<!--(.*?)-->/g)].map((match) => match[1]),
    markers: {
      completedSuspenseStart: text.includes("<!--$-->"),
      pendingSuspenseStart: text.includes("<!--$?-->"),
      clientRenderedSuspenseStart: text.includes("<!--$!-->"),
      suspenseEnd: text.includes("<!--/$-->"),
      activityStart: text.includes("<!--&-->"),
      activityEnd: text.includes("<!--/&-->"),
      formMatching: text.includes("<!--F-->"),
      formNotMatching: text.includes("<!--F!-->"),
      hasTemplate: text.includes("<template"),
      hasDataDigest: text.includes("data-dgst"),
      hasDataMessage: text.includes("data-msg"),
      hasComponentStack: text.includes("data-cstck"),
      hasPlaceholderId: /<template id="[^"]*P:/u.test(text),
      hasSegmentId: /id="[^"]*S:/u.test(text),
      hasBoundaryId: /id="[^"]*B:/u.test(text)
    }
  };
}

function describePipeableResult(pipeable) {
  return {
    value: describeValue(pipeable),
    objectKeys: Object.keys(pipeable),
    ownKeys: Reflect.ownKeys(pipeable).map(describeKey),
    pipe: describeValue(pipeable?.pipe),
    abort: describeValue(pipeable?.abort)
  };
}

function describeReadableStream(stream) {
  return {
    value: describeValue(stream),
    objectKeys: Object.keys(stream),
    ownKeys: Reflect.ownKeys(stream).map(describeKey),
    allReady: describeValue(stream?.allReady),
    locked: stream?.locked ?? null
  };
}

async function describeStaticPrerenderResult(result, streamKind) {
  const preludeText =
    streamKind === "node"
      ? await readNodeStreamText(result.prelude)
      : await readWebStreamText(result.prelude);

  return {
    objectKeys: Object.keys(result),
    ownKeys: Reflect.ownKeys(result).map(describeKey),
    prelude: describeValue(result.prelude),
    postponed: describeValue(result.postponed),
    preludeOutput: summarizeMarkupText(preludeText)
  };
}

function readNodeStreamText(stream) {
  return new Promise((resolve, reject) => {
    let text = "";
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      text += chunk;
    });
    stream.on("end", () => {
      resolve(text);
    });
    stream.on("error", reject);
  });
}

async function readWebStreamText(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    if (typeof value === "string") {
      text += value;
    } else {
      text += decoder.decode(value, { stream: true });
    }
  }

  text += decoder.decode();
  return text;
}

function describeDescriptor(descriptor) {
  if (!descriptor) {
    return null;
  }

  const described = {
    kind:
      Object.hasOwn(descriptor, "value") || Object.hasOwn(descriptor, "writable")
        ? "data"
        : "accessor",
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable
  };

  if (described.kind === "data") {
    described.writable = descriptor.writable;
    described.value = describeValue(descriptor.value);
  } else {
    described.get = describeValue(descriptor.get);
    described.set = describeValue(descriptor.set);
  }

  return described;
}

function describeValue(value) {
  if (value === null) {
    return { type: "null" };
  }

  const valueType = typeof value;
  if (valueType === "undefined") {
    return { type: "undefined" };
  }
  if (valueType === "string") {
    return { type: "string", value };
  }
  if (valueType === "number") {
    return Number.isNaN(value)
      ? { type: "number", value: "NaN" }
      : { type: "number", value };
  }
  if (valueType === "boolean") {
    return { type: "boolean", value };
  }
  if (valueType === "bigint") {
    return { type: "bigint", value: value.toString() };
  }
  if (valueType === "symbol") {
    return { type: "symbol", key: Symbol.keyFor(value), description: value.description };
  }
  if (valueType === "function") {
    return {
      type: "function",
      name: value.name,
      length: value.length
    };
  }

  return {
    type: "object",
    tag: Object.prototype.toString.call(value),
    constructorName: value?.constructor?.name ?? null,
    objectKeys: Object.keys(value),
    ownKeys: Reflect.ownKeys(value).map(describeKey)
  };
}

function describeError(error) {
  if (!error || typeof error !== "object") {
    return {
      name: "ThrownNonError",
      message: String(error),
      value: describeValue(error)
    };
  }

  return {
    name: error.name,
    message: normalizePathFragments(error.message),
    code: error.code ?? null,
    entrypoint: error.entrypoint ?? null,
    exportName: error.exportName ?? null,
    compatibilityTarget: error.compatibilityTarget ?? null,
    constructorName: error.constructor?.name ?? null,
    ownKeys: Reflect.ownKeys(error).map(describeKey)
  };
}

function describeKey(key) {
  if (typeof key === "symbol") {
    return {
      type: "symbol",
      key: Symbol.keyFor(key),
      description: key.description
    };
  }

  return {
    type: "string",
    value: key
  };
}

function normalizePathFragments(message) {
  return message
    .replace(/file:\/\/[^\s)]+/gu, "file://<path>")
    .replace(/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)]+/gu, "<path>");
}

main().catch((error) => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  writeProbeResultAndExit({
    targetPackage,
    scenarioId,
    result: {
      label: "probe-main",
      status: "throws",
      error: describeError(error)
    },
    consoleCalls
  });
});

function writeProbeResultAndExit(result) {
  process.stdout.write(JSON.stringify(result), () => {
    process.exit(0);
  });
}
