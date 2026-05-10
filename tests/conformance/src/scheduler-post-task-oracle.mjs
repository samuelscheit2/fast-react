import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { SCHEDULER_POST_TASK_ORACLE_ARTIFACT_PATH } from "./scheduler-post-task-targets.mjs";

const require = createRequire(import.meta.url);
const workspaceSchedulerPackageRoot = fileURLToPath(
  new URL("../../../packages/scheduler/", import.meta.url)
);
const workspaceSchedulerPostTaskEntrypoint = fileURLToPath(
  new URL("../../../packages/scheduler/unstable_post_task.js", import.meta.url)
);

export const SCHEDULER_POST_TASK_PRIORITY_DIAGNOSTICS_SYMBOL_DESCRIPTION =
  "fast-react.scheduler.unstable_post_task.priority-diagnostics";

export const SCHEDULER_POST_TASK_PRIORITY_DIAGNOSTICS_SYMBOL = Symbol.for(
  SCHEDULER_POST_TASK_PRIORITY_DIAGNOSTICS_SYMBOL_DESCRIPTION
);

export function stringifySchedulerPostTaskOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedSchedulerPostTaskOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedSchedulerPostTaskOracleText(baseUrl));
}

export function readCheckedSchedulerPostTaskOracleText(baseUrl = import.meta.url) {
  return readFileSync(
    new URL(`../${SCHEDULER_POST_TASK_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatSchedulerPostTaskOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.area}; entrypoints: ${scenario.entrypoints.join(", ")}`
  );

  const modeLines = oracle.probeModes.map((mode) => {
    const observationCount = oracle.schedulerObservations[mode.id]?.length ?? 0;
    const fastReactStatuses = countStatuses(
      oracle.fastReactComparisons?.[mode.id] ?? []
    );

    return `- ${mode.id}: ${observationCount} scheduler observations; Fast React comparisons ${JSON.stringify(fastReactStatuses)}`;
  });

  const coverageLines = Object.entries(oracle.coverage).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  const caveatLines = oracle.timingCaveats.map((caveat) => `- ${caveat}`);

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  const riskLines = (oracle.implementationRisks ?? []).map(
    (risk) => `- ${risk}`
  );

  return [
    "# Scheduler Post Task Oracle",
    "",
    "Generated from the exact scheduler 0.27.0 npm artifact and the current local scheduler implementation. This oracle records normalized scheduler/unstable_post_task behavior under plain Node and controlled Task Scheduling API shims; it keeps broad Fast React scheduler compatibility claims false.",
    "",
    "## Scenarios",
    "",
    ...scenarioLines,
    "",
    "## Probe Modes",
    "",
    ...modeLines,
    "",
    "## Coverage",
    "",
    ...coverageLines,
    "",
    "## Timing Caveats",
    "",
    ...caveatLines,
    "",
    "## Implementation Risks",
    "",
    ...riskLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findSchedulerPostTaskObservation(oracle, modeId, scenarioId) {
  const observation = oracle.schedulerObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing scheduler post-task observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findFastReactSchedulerPostTaskObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.fastReactObservations?.[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing Fast React scheduler post-task observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findFastReactSchedulerPostTaskComparison(
  oracle,
  modeId,
  scenarioId
) {
  const comparison = oracle.fastReactComparisons?.[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!comparison) {
    throw new Error(
      `Missing Fast React scheduler post-task comparison: ${modeId}:${scenarioId}`
    );
  }
  return comparison;
}

export function readSchedulerPostTaskPriorityDiagnostics(node) {
  const readDiagnostics =
    node?.[SCHEDULER_POST_TASK_PRIORITY_DIAGNOSTICS_SYMBOL];
  return typeof readDiagnostics === "function" ? readDiagnostics() : null;
}

export function inspectSchedulerPostTaskPriorityDiagnostics({
  enableDiagnostics = true,
  nodeEnv = "development",
  withYield = true
} = {}) {
  return withSchedulerPostTaskRuntime(
    {
      enableDiagnostics,
      nodeEnv,
      withYield
    },
    ({ Scheduler, shim }) => {
      const scheduled = [
        ["immediate", Scheduler.unstable_ImmediatePriority, undefined],
        ["user-blocking", Scheduler.unstable_UserBlockingPriority, null],
        ["normal", Scheduler.unstable_NormalPriority, {}],
        ["low-delay", Scheduler.unstable_LowPriority, { delay: 7 }],
        ["idle-zero-delay", Scheduler.unstable_IdlePriority, { delay: 0 }],
        ["invalid-delay", 99, { delay: 2 }]
      ].map(([label, priorityLevel, options]) => {
        const callbackEvents = [];
        const node = Scheduler.unstable_scheduleCallback(
          priorityLevel,
          (didTimeout) => {
            callbackEvents.push({
              label,
              didTimeout,
              currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
            });
          },
          options
        );
        const scheduleEvents = shim.takeEvents();

        return {
          label,
          priorityLevel,
          publicNodeKeys: Object.keys(node),
          privateDiagnosticSymbolPresent:
            Reflect.ownKeys(node).includes(
              SCHEDULER_POST_TASK_PRIORITY_DIAGNOSTICS_SYMBOL
            ),
          diagnosticsBeforeFlush:
            readSchedulerPostTaskPriorityDiagnostics(node),
          scheduleEvents,
          callbackEvents,
          node
        };
      });
      const schedulingFlush = shim.flushPostTasks();
      const scheduling = scheduled.map(({ node, ...entry }) => ({
        ...entry,
        diagnosticsAfterFlush: readSchedulerPostTaskPriorityDiagnostics(node)
      }));
      const schedulingPostFlushEvents = shim.takeEvents();

      const cancellationNode = Scheduler.unstable_scheduleCallback(
        Scheduler.unstable_NormalPriority,
        () => {
          throw new Error("cancelled post-task callback should not run");
        }
      );
      const cancellationScheduleEvents = shim.takeEvents();
      const cancellationBeforeCancel =
        readSchedulerPostTaskPriorityDiagnostics(cancellationNode);
      const cancellationReturn = Scheduler.unstable_cancelCallback(
        cancellationNode
      );
      const cancellationAfterCancel =
        readSchedulerPostTaskPriorityDiagnostics(cancellationNode);
      const cancellationEvents = shim.takeEvents();
      const cancellationFlush = shim.flushPostTasks();

      const continuationEvents = [];
      const continuationNode = Scheduler.unstable_scheduleCallback(
        Scheduler.unstable_NormalPriority,
        () => {
          continuationEvents.push({
            label: "start",
            currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
          });
          return () => {
            continuationEvents.push({
              label: "continuation",
              currentPriorityLevel:
                Scheduler.unstable_getCurrentPriorityLevel()
            });
          };
        }
      );
      const continuationScheduleEvents = shim.takeEvents();
      const continuationBeforeFlush =
        readSchedulerPostTaskPriorityDiagnostics(continuationNode);
      const continuationFlush = shim.flushPostTasks();
      const continuationAfterFlush =
        readSchedulerPostTaskPriorityDiagnostics(continuationNode);
      const continuationPostFlushEvents = shim.takeEvents();

      const continuationAbortEvents = [];
      const continuationAbortNode = Scheduler.unstable_scheduleCallback(
        Scheduler.unstable_NormalPriority,
        () => {
          continuationAbortEvents.push({
            label: "start",
            currentPriorityLevel: Scheduler.unstable_getCurrentPriorityLevel()
          });
          return () => {
            continuationAbortEvents.push({
              label: "continuation",
              currentPriorityLevel:
                Scheduler.unstable_getCurrentPriorityLevel()
            });
          };
        }
      );
      const continuationAbortScheduleEvents = shim.takeEvents();
      const continuationAbortBeforeFlush =
        readSchedulerPostTaskPriorityDiagnostics(continuationAbortNode);
      const continuationAbortInitialFlush = shim.flushPostTasks(1);
      const continuationAbortAfterFallback =
        readSchedulerPostTaskPriorityDiagnostics(continuationAbortNode);
      const continuationAbortFallbackEvents = shim.takeEvents();
      const continuationAbortReturn = Scheduler.unstable_cancelCallback(
        continuationAbortNode
      );
      const continuationAbortAfterCancel =
        readSchedulerPostTaskPriorityDiagnostics(continuationAbortNode);
      const continuationAbortCancellationEvents = shim.takeEvents();
      const continuationAbortFinalFlush = shim.flushPostTasks();
      const continuationAbortAfterFinalFlush =
        readSchedulerPostTaskPriorityDiagnostics(continuationAbortNode);

      return {
        nodeEnv,
        withYield,
        enableDiagnostics,
        exportKeys: Object.keys(Scheduler),
        scheduling,
        schedulingFlush,
        schedulingPostFlushEvents,
        cancellation: {
          publicNodeKeys: Object.keys(cancellationNode),
          privateDiagnosticSymbolPresent:
            Reflect.ownKeys(cancellationNode).includes(
              SCHEDULER_POST_TASK_PRIORITY_DIAGNOSTICS_SYMBOL
            ),
          scheduleEvents: cancellationScheduleEvents,
          diagnosticsBeforeCancel: cancellationBeforeCancel,
          cancelReturnType: typeof cancellationReturn,
          diagnosticsAfterCancel: cancellationAfterCancel,
          cancellationEvents,
          cancellationFlush
        },
        continuation: {
          publicNodeKeys: Object.keys(continuationNode),
          privateDiagnosticSymbolPresent:
            Reflect.ownKeys(continuationNode).includes(
              SCHEDULER_POST_TASK_PRIORITY_DIAGNOSTICS_SYMBOL
            ),
          scheduleEvents: continuationScheduleEvents,
          diagnosticsBeforeFlush: continuationBeforeFlush,
          flush: continuationFlush,
          events: continuationEvents,
          diagnosticsAfterFlush: continuationAfterFlush,
          postFlushEvents: continuationPostFlushEvents
        },
        continuationAbortAfterFallback: {
          publicNodeKeys: Object.keys(continuationAbortNode),
          privateDiagnosticSymbolPresent:
            Reflect.ownKeys(continuationAbortNode).includes(
              SCHEDULER_POST_TASK_PRIORITY_DIAGNOSTICS_SYMBOL
            ),
          scheduleEvents: continuationAbortScheduleEvents,
          diagnosticsBeforeFlush: continuationAbortBeforeFlush,
          initialFlush: continuationAbortInitialFlush,
          diagnosticsAfterFallback: continuationAbortAfterFallback,
          fallbackEvents: continuationAbortFallbackEvents,
          cancelReturnType: typeof continuationAbortReturn,
          diagnosticsAfterCancel: continuationAbortAfterCancel,
          cancellationEvents: continuationAbortCancellationEvents,
          finalFlush: continuationAbortFinalFlush,
          diagnosticsAfterFinalFlush: continuationAbortAfterFinalFlush,
          events: continuationAbortEvents
        }
      };
    }
  );
}

function countStatuses(comparisons) {
  const counts = {};
  for (const comparison of comparisons) {
    counts[comparison.status] = (counts[comparison.status] ?? 0) + 1;
  }
  return counts;
}

function withSchedulerPostTaskRuntime(
  { enableDiagnostics, nodeEnv, withYield },
  callback
) {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousGlobals = capturePostTaskGlobals();

  clearWorkspaceSchedulerPostTaskCache();
  delete globalThis.window;
  delete globalThis.scheduler;
  delete globalThis.TaskController;
  delete globalThis.__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__;

  if (enableDiagnostics) {
    globalThis.__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__ = true;
  }
  process.env.NODE_ENV = nodeEnv;
  const shim = installPostTaskPriorityDiagnosticsShim({ withYield });

  try {
    const Scheduler = require(workspaceSchedulerPostTaskEntrypoint);
    return callback({ Scheduler, shim });
  } finally {
    clearWorkspaceSchedulerPostTaskCache();
    restorePostTaskGlobals(previousGlobals);
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

function installPostTaskPriorityDiagnosticsShim({ withYield }) {
  const events = [];
  const postTaskQueue = [];
  let now = 100;
  let nextSignalId = 1;

  class TaskController {
    constructor(options) {
      this.priority = options.priority;
      this.signal = {
        id: nextSignalId++,
        aborted: false,
        priority: options.priority
      };
      events.push({
        type: "TaskController",
        priority: options.priority,
        signalId: this.signal.id
      });
    }

    abort() {
      this.signal.aborted = true;
      events.push({
        type: "abort",
        priority: this.priority,
        signalId: this.signal.id
      });
    }
  }

  globalThis.window = {
    performance: {
      now: () => now
    },
    setTimeout(callback) {
      events.push({
        type: "window.setTimeout",
        callbackType: typeof callback
      });
      return 1;
    }
  };
  globalThis.TaskController = TaskController;
  globalThis.scheduler = {
    postTask(task, options = {}) {
      events.push(describePostTaskShimCall(options));
      postTaskQueue.push({ task, options });
      return catchablePostTaskThenable();
    }
  };

  if (withYield) {
    globalThis.scheduler.yield = (options = {}) => {
      events.push({
        type: "yield",
        signal: describeShimSignal(options.signal)
      });
      return {
        then(onFulfilled) {
          events.push({
            type: "yield.then",
            signal: describeShimSignal(options.signal)
          });
          onFulfilled();
          return catchablePostTaskThenable();
        },
        catch() {
          return this;
        }
      };
    };
  }

  return {
    setNow(value) {
      now = value;
    },
    takeEvents() {
      const taken = events.slice();
      events.length = 0;
      return taken;
    },
    flushPostTasks(maxTasks) {
      const flushEvents = [];
      let flushedTaskCount = 0;
      let guard = 0;
      while (
        postTaskQueue.length > 0 &&
        (maxTasks === undefined || flushedTaskCount < maxTasks)
      ) {
        if (guard++ > 20) {
          throw new Error("postTask diagnostics shim exceeded flush guard");
        }
        const next = postTaskQueue.shift();
        flushedTaskCount++;
        if (next.options.signal?.aborted) {
          flushEvents.push({
            type: "skip-aborted",
            signal: describeShimSignal(next.options.signal)
          });
          continue;
        }
        flushEvents.push({
          type: "run-post-task",
          signal: describeShimSignal(next.options.signal)
        });
        next.task();
      }
      return flushEvents;
    }
  };
}

function describePostTaskShimCall(options) {
  return {
    type: "postTask",
    hasDelayProperty: Object.hasOwn(options, "delay"),
    delay:
      options.delay === undefined
        ? { type: "undefined", value: null }
        : { type: typeof options.delay, value: options.delay },
    signal: describeShimSignal(options.signal)
  };
}

function describeShimSignal(signal) {
  return {
    id: signal?.id ?? null,
    priority: signal?.priority ?? null,
    aborted: signal?.aborted === true
  };
}

function catchablePostTaskThenable() {
  return {
    catch() {
      return this;
    }
  };
}

function capturePostTaskGlobals() {
  return {
    window: captureGlobalProperty("window"),
    scheduler: captureGlobalProperty("scheduler"),
    TaskController: captureGlobalProperty("TaskController"),
    diagnosticsFlag: captureGlobalProperty(
      "__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__"
    )
  };
}

function captureGlobalProperty(propertyName) {
  return {
    hadProperty: Object.hasOwn(globalThis, propertyName),
    value: globalThis[propertyName]
  };
}

function restorePostTaskGlobals(previousGlobals) {
  restoreGlobalProperty("window", previousGlobals.window);
  restoreGlobalProperty("scheduler", previousGlobals.scheduler);
  restoreGlobalProperty("TaskController", previousGlobals.TaskController);
  restoreGlobalProperty(
    "__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__",
    previousGlobals.diagnosticsFlag
  );
}

function restoreGlobalProperty(propertyName, previous) {
  if (previous.hadProperty) {
    globalThis[propertyName] = previous.value;
  } else {
    delete globalThis[propertyName];
  }
}

function clearWorkspaceSchedulerPostTaskCache() {
  for (const id of Object.keys(require.cache)) {
    if (id.startsWith(workspaceSchedulerPackageRoot)) {
      delete require.cache[id];
    }
  }
}
