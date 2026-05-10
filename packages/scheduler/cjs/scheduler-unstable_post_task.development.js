/**
 * @license React
 * scheduler-unstable_post_task.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";
"production" !== process.env.NODE_ENV &&
  (function () {
    function runTask(priorityLevel, postTaskPriority, node, callback) {
      deadline = getCurrentTime() + 5;
      try {
        currentPriorityLevel_DEPRECATED = priorityLevel;
        var callbackRun = recordPrivatePostTaskCallbackRun(
          node,
          priorityLevel,
          postTaskPriority
        );
        var result = callback(!1);
        recordPrivatePostTaskCallbackResult(node, callbackRun, result);
        if ("function" === typeof result) {
          var continuationOptions = { signal: node._controller.signal },
            nextTask = runTask.bind(
              null,
              priorityLevel,
              postTaskPriority,
              node,
              result
            );
          recordPrivatePostTaskContinuationFallback(
            node,
            priorityLevel,
            postTaskPriority,
            continuationOptions,
            void 0 !== scheduler.yield
              ? "scheduler.yield"
              : "scheduler.postTask"
          );
          void 0 !== scheduler.yield
            ? scheduler
                .yield(continuationOptions)
                .then(nextTask)
                .catch(handleAbortError)
            : scheduler
                .postTask(nextTask, continuationOptions)
                .catch(handleAbortError);
        }
      } catch (error) {
        setTimeout(function () {
          throw error;
        });
      } finally {
        currentPriorityLevel_DEPRECATED = 3;
      }
    }
    function handleAbortError() {}
    function createPrivatePostTaskPriorityRecord(
      priorityLevel,
      postTaskPriority,
      postTaskOptions,
      controller
    ) {
      var record = {
        status: "private-scheduler-post-task-priority-diagnostics",
        version: 1,
        exportName: privatePostTaskPriorityDiagnosticsExport,
        symbolDescription: privatePostTaskPriorityDiagnosticsSymbolDescription,
        entrypoint: "scheduler/unstable_post_task",
        compatibilityTarget: schedulerCompatibilityTarget,
        diagnosticKind: "shimmed-task-controller-priority",
        diagnosticEventSequence: 0,
        environmentCapabilities: null,
        priorityMapping: null,
        schedule: null,
        cancellation: null,
        callbackRuns: [],
        continuationFallbacks: [],
        rootContinuationExecutionRoute: null,
        actRootWorkHandoffDiagnostics: false,
        environmentCapabilityDiagnostics: true,
        priorityMappingDiagnostics: true,
        shimmedTaskControllerScheduling: true,
        shimmedTaskControllerCancellation: false,
        continuationFallbackDiagnostics: false,
        taskControllerAbortOrderingDiagnostics: false,
        continuationFallbackMetadataDiagnostics: false,
        continuationSignalValidationDiagnostics: false,
        continuationAbortOrderingDiagnostics: false,
        delayAbortOrderingDiagnostics: false,
        rootContinuationExecutionRouteDiagnostics: false,
        fallbackEnvironmentClassificationDiagnostics: false,
        browserPostTaskCompatibilityClaimed: false,
        browserTaskOrderingCompatibilityClaimed: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        compatibilityClaimed: false
      };
      record.environmentCapabilities =
        describePrivatePostTaskEnvironmentCapabilities();
      record.priorityMapping = describePrivatePostTaskPriorityMapping(
        priorityLevel,
        postTaskPriority
      );
      record.schedule = {
        status: "scheduled-shimmed-task-controller",
        diagnosticEventIndex:
          claimPrivatePostTaskDiagnosticEventIndex(record),
        priorityLevel: priorityLevel,
        postTaskPriority: postTaskPriority,
        priorityMapping: record.priorityMapping,
        delay: describePrivatePostTaskDelay(postTaskOptions),
        environmentCapabilities: record.environmentCapabilities,
        controller: describePrivatePostTaskController(controller),
        signal: describePrivatePostTaskSignal(controller.signal)
      };
      return record;
    }
    function attachPrivatePostTaskPriorityDiagnostics(node, record) {
      privatePostTaskPriorityDiagnosticsByNode.set(node, record);
      Object.defineProperty(node, privatePostTaskPriorityDiagnosticsSymbol, {
        value: function () {
          return snapshotPrivatePostTaskPriorityRecord(record);
        }
      });
    }
    function getPrivatePostTaskPriorityRecord(node) {
      return privatePostTaskPriorityDiagnosticsByNode.get(node) || null;
    }
    function recordPrivatePostTaskCallbackRun(
      node,
      priorityLevel,
      postTaskPriority
    ) {
      var record = getPrivatePostTaskPriorityRecord(node);
      if (null === record) {
        return;
      }
      var callbackRun = {
        status: "ran-shimmed-post-task-callback",
        diagnosticEventIndex: claimPrivatePostTaskDiagnosticEventIndex(record),
        runIndex: record.callbackRuns.length,
        priorityLevel: priorityLevel,
        postTaskPriority: postTaskPriority,
        scheduledDelay: record.schedule ? record.schedule.delay : null,
        currentPriorityLevel: currentPriorityLevel_DEPRECATED,
        didTimeout: false,
        shouldYieldAtStart: getCurrentTime() >= deadline,
        signal: describePrivatePostTaskSignal(node._controller.signal),
        continuationStatus: "callback-running",
        returnedContinuationType: null,
        callbackRunCountAtReturn: null,
        continuationFallbackCountAtReturn: null,
        continuationFallbackIndex: null,
        fallbackEnvironmentClassification: null
      };
      record.callbackRuns.push(callbackRun);
      return callbackRun;
    }
    function recordPrivatePostTaskCallbackResult(node, callbackRun, result) {
      var record = getPrivatePostTaskPriorityRecord(node);
      if (null === record || null === callbackRun) {
        return;
      }
      callbackRun.returnedContinuationType = typeof result;
      callbackRun.callbackRunCountAtReturn = record.callbackRuns.length;
      callbackRun.continuationFallbackCountAtReturn =
        record.continuationFallbacks.length;
      callbackRun.continuationStatus =
        "function" === typeof result
          ? "returned-continuation"
          : "completed-without-continuation";
    }
    function recordPrivatePostTaskContinuationFallback(
      node,
      priorityLevel,
      postTaskPriority,
      continuationOptions,
      fallback
    ) {
      var record = getPrivatePostTaskPriorityRecord(node);
      if (null === record) {
        return;
      }
      var sourceCallbackRunIndex = record.callbackRuns.length - 1,
        callbackRunCountAtSchedule = record.callbackRuns.length,
        reusesOriginalSignal =
          continuationOptions.signal === node._controller.signal,
        continuationOptionsDescription =
          describePrivatePostTaskContinuationOptions(
            continuationOptions,
            node
          ),
        signalAtSchedule = describePrivatePostTaskSignal(
          continuationOptions.signal
        ),
        continuationIndex = record.continuationFallbacks.length,
        fallbackEnvironmentClassification =
          describePrivatePostTaskFallbackEnvironmentClassification(fallback),
        signalValidation = describePrivatePostTaskContinuationSignalValidation(
          continuationOptions,
          node,
          signalAtSchedule
        ),
        abortOrdering = createPrivatePostTaskContinuationAbortOrdering(
          continuationIndex,
          sourceCallbackRunIndex,
          callbackRunCountAtSchedule,
          signalAtSchedule
        ),
        sourceCallbackRun =
          0 <= sourceCallbackRunIndex
            ? record.callbackRuns[sourceCallbackRunIndex]
            : null;
      var continuationRecord = {
        status: "scheduled-shimmed-post-task-continuation",
        diagnosticEventIndex: claimPrivatePostTaskDiagnosticEventIndex(record),
        continuationIndex: continuationIndex,
        sourceCallbackRunIndex: sourceCallbackRunIndex,
        callbackRunCountAtSchedule: callbackRunCountAtSchedule,
        fallback: fallback,
        priorityLevel: priorityLevel,
        postTaskPriority: postTaskPriority,
        continuationOptions: continuationOptionsDescription,
        continuationStatus: "scheduled-continuation-fallback",
        continuationMetadata: {
          status: "shimmed-post-task-continuation-metadata",
          continuationStatus: "scheduled-continuation-fallback",
          selectedFallback: fallback,
          schedulerYieldAvailableAtSchedule: void 0 !== scheduler.yield,
          schedulerPostTaskAvailableAtSchedule:
            "function" === typeof scheduler.postTask,
          sourceCallbackRunIndex: sourceCallbackRunIndex,
          callbackRunCountAtSchedule: callbackRunCountAtSchedule,
          reusesOriginalSignal: reusesOriginalSignal,
          signalAbortedAtSchedule: signalAtSchedule.aborted,
          signalValidationStatus: signalValidation.status,
          signalValidationRejectionReason: signalValidation.rejectionReason,
          abortOrderingStatus: abortOrdering.status,
          fallbackEnvironmentClassification:
            fallbackEnvironmentClassification.classification,
          fallbackEnvironmentKind:
            fallbackEnvironmentClassification.environmentKind,
          rootContinuationExecutionRouteStatus:
            "pending-private-root-continuation-execution-route",
          browserPostTaskCompatibilityClaimed: false,
          publicSchedulerTimingCompatibilityClaimed: false,
          compatibilityClaimed: false
        },
        fallbackEnvironmentClassification: fallbackEnvironmentClassification,
        signalValidation: signalValidation,
        abortOrdering: abortOrdering,
        reusesOriginalSignal: reusesOriginalSignal,
        signalAtSchedule: signalAtSchedule,
        signal: signalAtSchedule,
        browserPostTaskCompatibilityClaimed: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        compatibilityClaimed: false
      };
      record.continuationFallbackDiagnostics = true;
      record.continuationFallbackMetadataDiagnostics = true;
      record.continuationSignalValidationDiagnostics = true;
      record.rootContinuationExecutionRouteDiagnostics = true;
      record.fallbackEnvironmentClassificationDiagnostics = true;
      if (sourceCallbackRun) {
        sourceCallbackRun.continuationStatus =
          "scheduled-continuation-fallback";
        sourceCallbackRun.continuationFallbackIndex = continuationIndex;
        sourceCallbackRun.fallbackEnvironmentClassification =
          fallbackEnvironmentClassification;
      }
      record.continuationFallbacks.push(continuationRecord);
      record.rootContinuationExecutionRoute =
        createPrivatePostTaskRootContinuationExecutionRoute(
          record,
          continuationRecord
        );
    }
    function recordPrivatePostTaskCancellationStart(node) {
      var record = getPrivatePostTaskPriorityRecord(node);
      if (null === record) {
        return null;
      }
      record.shimmedTaskControllerCancellation = true;
      record.taskControllerAbortOrderingDiagnostics = true;
      record.delayAbortOrderingDiagnostics = true;
      record.fallbackEnvironmentClassificationDiagnostics = true;
      var signalBeforeAbort = describePrivatePostTaskSignal(
          node._controller.signal
        ),
        requestEventIndex = claimPrivatePostTaskDiagnosticEventIndex(record),
        fallbackEnvironmentClassification =
          describePrivatePostTaskFallbackEnvironmentClassification(
            0 < record.continuationFallbacks.length
              ? record.continuationFallbacks[
                  record.continuationFallbacks.length - 1
                ].fallback
              : null
          );
      record.cancellation = {
        status: "cancelled-shimmed-task-controller",
        abortOrdering: {
          status: "task-controller-abort-requested-before-abort-call",
          requestEventIndex: requestEventIndex,
          completionEventIndex: null,
          signalAbortedBeforeAbort:
            node._controller.signal.aborted === true,
          signalAbortedAfterAbort: null,
          callbackRunCountAtRequest: record.callbackRuns.length,
          callbackRunCountAtCompletion: null,
          continuationFallbackCountAtRequest:
            record.continuationFallbacks.length,
          continuationFallbackCountAtCompletion: null
        },
        delayAbortOrdering: {
          status: "delay-abort-ordering-requested-before-abort-call",
          requestEventIndex: requestEventIndex,
          completionEventIndex: null,
          scheduledDelay: record.schedule ? record.schedule.delay : null,
          scheduledPriority: record.schedule
            ? {
                priorityLevel: record.schedule.priorityLevel,
                postTaskPriority: record.schedule.postTaskPriority
              }
            : null,
          signalBeforeAbort: signalBeforeAbort,
          signalAfterAbort: null,
          abortSignalStateAfterAbort: null,
          continuationStatusAtRequest:
            describePrivatePostTaskContinuationStatus(record),
          continuationStatusAtCompletion: null,
          fallbackEnvironmentClassification:
            fallbackEnvironmentClassification,
          browserPostTaskCompatibilityClaimed: false,
          browserTaskOrderingCompatibilityClaimed: false,
          publicSchedulerTimingCompatibilityClaimed: false,
          compatibilityClaimed: false
        },
        abortMetadata: {
          status: "shimmed-task-controller-abort-metadata",
          controller: describePrivatePostTaskController(node._controller),
          signalSource: "node._controller.signal",
          signalAbortedBeforeAbort: signalBeforeAbort.aborted,
          signalAbortedAfterAbort: null,
          callbackRunCountBeforeAbort: record.callbackRuns.length,
          callbackRunCountAfterAbort: null,
          continuationFallbackCountBeforeAbort:
            record.continuationFallbacks.length,
          continuationFallbackCountAfterAbort: null,
          abortMarkedSignalAborted: null,
          browserPostTaskCompatibilityClaimed: false,
          publicSchedulerTimingCompatibilityClaimed: false,
          compatibilityClaimed: false
        },
        signalBeforeAbort: signalBeforeAbort,
        signalAfterAbort: null,
        signal: null,
        abortObserved: false,
        browserPostTaskCompatibilityClaimed: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        compatibilityClaimed: false
      };
      return record.cancellation;
    }
    function recordPrivatePostTaskCancellationComplete(node, cancellation) {
      var record = getPrivatePostTaskPriorityRecord(node);
      if (null === record || null === cancellation) {
        return;
      }
      cancellation.abortOrdering.status =
        "task-controller-abort-observed-after-abort-call";
      var completionEventIndex =
        claimPrivatePostTaskDiagnosticEventIndex(record);
      cancellation.abortOrdering.completionEventIndex = completionEventIndex;
      cancellation.abortOrdering.signalAbortedAfterAbort =
        node._controller.signal.aborted === true;
      cancellation.abortOrdering.callbackRunCountAtCompletion =
        record.callbackRuns.length;
      cancellation.abortOrdering.continuationFallbackCountAtCompletion =
        record.continuationFallbacks.length;
      cancellation.signalAfterAbort = describePrivatePostTaskSignal(
        node._controller.signal
      );
      cancellation.signal = cancellation.signalAfterAbort;
      cancellation.abortObserved = node._controller.signal.aborted === true;
      cancellation.delayAbortOrdering.status =
        "delay-abort-ordering-observed-after-abort-call";
      cancellation.delayAbortOrdering.completionEventIndex =
        completionEventIndex;
      cancellation.delayAbortOrdering.signalAfterAbort =
        cancellation.signalAfterAbort;
      cancellation.delayAbortOrdering.abortSignalStateAfterAbort =
        cancellation.signalAfterAbort.aborted ? "aborted" : "not-aborted";
      cancellation.delayAbortOrdering.continuationStatusAtCompletion =
        describePrivatePostTaskContinuationStatus(record);
      recordPrivatePostTaskContinuationAbortOrdering(
        record,
        cancellation,
        completionEventIndex
      );
      cancellation.abortMetadata.signalAbortedAfterAbort =
        cancellation.signalAfterAbort.aborted;
      cancellation.abortMetadata.callbackRunCountAfterAbort =
        record.callbackRuns.length;
      cancellation.abortMetadata.continuationFallbackCountAfterAbort =
        record.continuationFallbacks.length;
      cancellation.abortMetadata.abortMarkedSignalAborted =
        cancellation.signalBeforeAbort.aborted === false &&
        cancellation.signalAfterAbort.aborted === true;
    }
    function recordPrivatePostTaskContinuationAbortOrdering(
      record,
      cancellation,
      completionEventIndex
    ) {
      var continuationFallbackCount = record.continuationFallbacks.length;
      if (0 === continuationFallbackCount) {
        return;
      }
      var continuation =
          record.continuationFallbacks[continuationFallbackCount - 1],
        abortOrdering = continuation.abortOrdering;
      if (!abortOrdering) {
        return;
      }
      record.continuationAbortOrderingDiagnostics = true;
      abortOrdering.status =
        "continuation-abort-ordering-observed-after-abort-call";
      abortOrdering.requestEventIndex =
        cancellation.abortOrdering.requestEventIndex;
      abortOrdering.completionEventIndex = completionEventIndex;
      abortOrdering.signalBeforeAbort = cancellation.signalBeforeAbort;
      abortOrdering.signalAfterAbort = cancellation.signalAfterAbort;
      abortOrdering.abortSignalStateAfterAbort = cancellation.signalAfterAbort
        .aborted
        ? "aborted"
        : "not-aborted";
      abortOrdering.callbackRunCountAtAbortRequest =
        cancellation.abortOrdering.callbackRunCountAtRequest;
      abortOrdering.callbackRunCountAtAbortCompletion =
        record.callbackRuns.length;
      abortOrdering.continuationFallbackCountAtAbortRequest =
        cancellation.abortOrdering.continuationFallbackCountAtRequest;
      abortOrdering.continuationFallbackCountAtAbortCompletion =
        record.continuationFallbacks.length;
      abortOrdering.cancellationStatus = cancellation.status;
      if (continuation.continuationMetadata) {
        continuation.continuationMetadata.abortOrderingStatus =
          abortOrdering.status;
        continuation.continuationMetadata.abortSignalStateAfterAbort =
          abortOrdering.abortSignalStateAfterAbort;
        continuation.continuationMetadata.rootContinuationExecutionRouteStatus =
          "aborted-before-private-root-continuation-execution";
      }
      recordPrivatePostTaskRootContinuationExecutionRouteAbort(
        record,
        continuation,
        cancellation
      );
    }
    function createPrivatePostTaskRootContinuationExecutionRoute(
      record,
      continuation
    ) {
      var actRootWorkHandoff = createPrivatePostTaskActRootWorkHandoff(
        record,
        continuation,
        "pending-private-root-continuation-execution-route",
        null,
        null
      );
      if (null !== actRootWorkHandoff) {
        record.actRootWorkHandoffDiagnostics = true;
        recordPrivatePostTaskContinuationMetadataActRootWorkHandoff(
          continuation,
          actRootWorkHandoff
        );
      }
      return {
        status: "private-scheduler-post-task-root-continuation-execution-route",
        routeVersion: 1,
        routeName: "post-task-delay-abort-root-continuation",
        routeStatus: "pending-private-root-continuation-execution-route",
        accepted: true,
        rejected: false,
        rejectionReason: null,
        continuationIndex: continuation.continuationIndex,
        continuationDiagnosticEventIndex: continuation.diagnosticEventIndex,
        sourceCallbackRunIndex: continuation.sourceCallbackRunIndex,
        callbackRunCountAtSchedule: continuation.callbackRunCountAtSchedule,
        continuationFallbackCountAtSchedule:
          continuation.continuationIndex + 1,
        priorityLevel: continuation.priorityLevel,
        schedulerPriorityName: record.priorityMapping
          ? record.priorityMapping.schedulerPriorityName
          : null,
        postTaskPriority: continuation.postTaskPriority,
        taskControllerPriority: record.priorityMapping
          ? record.priorityMapping.taskControllerPriority
          : null,
        delay: record.schedule ? record.schedule.delay : null,
        fallback: continuation.fallback,
        fallbackEnvironmentClassification:
          continuation.fallbackEnvironmentClassification,
        signalAtSchedule: continuation.signalAtSchedule,
        signalValidation: continuation.signalValidation,
        abortOrdering: continuation.abortOrdering,
        delayAbortOrdering: null,
        abortSignal: null,
        hasActRootWorkHandoff: null !== actRootWorkHandoff,
        actRootWorkHandoff: actRootWorkHandoff,
        privateRootContinuationExecution:
          createPrivatePostTaskRootContinuationExecutionRecord(
            "pending-private-root-continuation-execution-route",
            continuation,
            null,
            null
          ),
        browserPostTaskCompatibilityClaimed: false,
        browserTaskOrderingCompatibilityClaimed: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        publicReactActCompatibilityClaimed: false,
        publicRootSchedulerCompatibilityClaimed: false,
        publicRendererCompatibilityClaimed: false,
        compatibilityClaimed: false
      };
    }
    function recordPrivatePostTaskContinuationMetadataActRootWorkHandoff(
      continuation,
      actRootWorkHandoff
    ) {
      if (!continuation.continuationMetadata || null === actRootWorkHandoff) {
        return;
      }
      continuation.continuationMetadata.actRootWorkHandoffStatus =
        actRootWorkHandoff.status;
      continuation.continuationMetadata.actRootWorkHandoffAccepted =
        actRootWorkHandoff.accepted === true;
      continuation.continuationMetadata.actRootWorkHandoffRouteStatus =
        actRootWorkHandoff.routeStatus;
      continuation.continuationMetadata.actRootWorkHandoffKind =
        actRootWorkHandoff.handoffKind;
      continuation.continuationMetadata.actRootWorkRecordCount =
        actRootWorkHandoff.rootWorkRecordCount;
      continuation.continuationMetadata.delayedCallbackPathAccepted =
        actRootWorkHandoff.delayedCallbackPathAccepted === true;
    }
    function createPrivatePostTaskRootContinuationExecutionRecord(
      status,
      continuation,
      cancellation,
      abortSignal
    ) {
      return {
        status: status,
        routeName: "post-task-delay-abort-root-continuation",
        routeSelected: true,
        continuationIndex: continuation.continuationIndex,
        sourceCallbackRunIndex: continuation.sourceCallbackRunIndex,
        callbackRunCountAtSchedule: continuation.callbackRunCountAtSchedule,
        callbackRunCountAtAbortRequest: cancellation
          ? cancellation.abortOrdering.callbackRunCountAtRequest
          : null,
        callbackRunCountAtAbortCompletion: cancellation
          ? cancellation.abortOrdering.callbackRunCountAtCompletion
          : null,
        continuationFallbackCountAtSchedule:
          continuation.continuationIndex + 1,
        continuationFallbackCountAtAbortRequest: cancellation
          ? cancellation.abortOrdering.continuationFallbackCountAtRequest
          : null,
        continuationFallbackCountAtAbortCompletion: cancellation
          ? cancellation.abortOrdering.continuationFallbackCountAtCompletion
          : null,
        abortSignalState:
          abortSignal && abortSignal.aborted === true
            ? "aborted"
            : abortSignal
              ? "not-aborted"
              : null,
        abortSemanticsPreserved:
          cancellation && abortSignal ? abortSignal.aborted === true : null,
        continuationCallbackExecuted: false,
        rendererWorkExecuted: false,
        reconcilerWorkExecuted: false,
        nativeRendererWorkExecuted: false,
        publicRootExecution: false,
        publicSchedulerFlush: false,
        browserPostTaskCompatibilityClaimed: false,
        browserTaskOrderingCompatibilityClaimed: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        compatibilityClaimed: false
      };
    }
    function createPrivatePostTaskActRootWorkHandoff(
      record,
      continuation,
      routeStatus,
      cancellation,
      abortSignal
    ) {
      var delay = record.schedule ? record.schedule.delay : null;
      if (!delay || "delayed-task" !== delay.delayClassification) {
        return null;
      }
      var rootWorkRecords = createPrivatePostTaskActRootWorkRecords(
          record,
          continuation
        ),
        abortSignalState =
          abortSignal && abortSignal.aborted === true
            ? "aborted"
            : abortSignal
              ? "not-aborted"
              : null;
      return {
        status: "accepted-private-scheduler-post-task-act-root-work-handoff",
        handoffKind:
          "fast-react.scheduler.post_task.private-act-root-work-handoff",
        handoffVersion: 1,
        entrypoint: "scheduler/unstable_post_task",
        compatibilityTarget: schedulerCompatibilityTarget,
        reactCompatibilityTarget: reactCompatibilityTarget,
        routeName: "post-task-delayed-act-root-continuation",
        routeStatus: routeStatus,
        accepted: true,
        rejected: false,
        rejectionReason: null,
        continuationIndex: continuation.continuationIndex,
        continuationDiagnosticEventIndex: continuation.diagnosticEventIndex,
        sourceCallbackRunIndex: continuation.sourceCallbackRunIndex,
        callbackRunCountAtSchedule: continuation.callbackRunCountAtSchedule,
        callbackRunCountAtAbortRequest: cancellation
          ? cancellation.abortOrdering.callbackRunCountAtRequest
          : null,
        callbackRunCountAtAbortCompletion: cancellation
          ? cancellation.abortOrdering.callbackRunCountAtCompletion
          : null,
        continuationFallbackCountAtSchedule:
          continuation.continuationIndex + 1,
        continuationFallbackCountAtAbortRequest: cancellation
          ? cancellation.abortOrdering.continuationFallbackCountAtRequest
          : null,
        continuationFallbackCountAtAbortCompletion: cancellation
          ? cancellation.abortOrdering.continuationFallbackCountAtCompletion
          : null,
        priorityLevel: continuation.priorityLevel,
        schedulerPriorityName: record.priorityMapping
          ? record.priorityMapping.schedulerPriorityName
          : null,
        postTaskPriority: continuation.postTaskPriority,
        taskControllerPriority: record.priorityMapping
          ? record.priorityMapping.taskControllerPriority
          : null,
        delay: delay,
        delayedCallbackPath: true,
        delayedCallbackPathAccepted: true,
        continuationStatus: continuation.continuationStatus,
        signalAtSchedule: continuation.signalAtSchedule,
        signalValidation: continuation.signalValidation,
        abortSignalState: abortSignalState,
        abortSemanticsPreserved:
          cancellation && abortSignal ? abortSignal.aborted === true : null,
        actQueueHandoffOnly: true,
        rootWorkMetadataOnly: true,
        rendererWorkExecutionBlocked: true,
        actQueueHandoff:
          createPrivatePostTaskActQueueHandoff(record, continuation),
        rootWorkRecords: rootWorkRecords,
        rootWorkRecordCount: rootWorkRecords.length,
        publicCompatibilityClaimed: false,
        browserPostTaskCompatibilityClaimed: false,
        browserTaskOrderingCompatibilityClaimed: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        publicReactActCompatibilityClaimed: false,
        publicRootSchedulerCompatibilityClaimed: false,
        publicRendererCompatibilityClaimed: false,
        drainsPublicSchedulerTaskQueue: false,
        drainsPublicReactActQueue: false,
        executesQueuedWork: false,
        executesEffects: false,
        executesRendererWork: false,
        executesRendererRoots: false,
        compatibilityClaimed: false
      };
    }
    function createPrivatePostTaskActQueueHandoff(record, continuation) {
      return {
        status: "accepted-private-scheduler-post-task-act-queue-handoff",
        recordKind: "SchedulerActQueueRequest",
        taskKind: "RootSchedule",
        continuationStatus: "PendingContinuation",
        accepted: true,
        schedulerPriorityName: record.priorityMapping
          ? record.priorityMapping.schedulerPriorityName
          : null,
        priorityLevel: continuation.priorityLevel,
        postTaskPriority: continuation.postTaskPriority,
        actQueueHandoffOnly: true,
        rootWorkMetadataOnly: true,
        publicCompatibilityClaimed: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        publicReactActCompatibilityClaimed: false,
        drainsPublicSchedulerTaskQueue: false,
        drainsPublicReactActQueue: false,
        executesQueuedWork: false,
        executesEffects: false,
        executesRendererWork: false,
        executesRendererRoots: false,
        compatibilityClaimed: false
      };
    }
    function createPrivatePostTaskActRootWorkRecords(record, continuation) {
      return [
        createPrivatePostTaskActRootWorkRecord(
          record,
          continuation,
          "RootLaneSchedulingSnapshot"
        ),
        createPrivatePostTaskActRootWorkRecord(
          record,
          continuation,
          "RootTaskScheduleRecord"
        )
      ];
    }
    function createPrivatePostTaskActRootWorkRecord(
      record,
      continuation,
      recordKind
    ) {
      return {
        recordKind: recordKind,
        accepted: true,
        rootId: "post-task-delayed-continuation-root",
        rootLabel: "scheduler-post-task-delayed-continuation-root",
        lane: "PostTaskContinuationLane",
        laneLabel: "PostTaskContinuationLane",
        continuationIndex: continuation.continuationIndex,
        sourceCallbackRunIndex: continuation.sourceCallbackRunIndex,
        priorityLevel: continuation.priorityLevel,
        schedulerPriorityName: record.priorityMapping
          ? record.priorityMapping.schedulerPriorityName
          : null,
        postTaskPriority: continuation.postTaskPriority,
        delayedCallbackPath: true,
        rendererWorkExecutionBlocked: true,
        rootWorkMetadataOnly: true,
        publicCompatibilityClaimed: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        publicReactActCompatibilityClaimed: false,
        publicRootSchedulerCompatibilityClaimed: false,
        publicRendererCompatibilityClaimed: false,
        drainsPublicSchedulerTaskQueue: false,
        drainsPublicReactActQueue: false,
        executesQueuedWork: false,
        executesEffects: false,
        executesRendererWork: false,
        executesRendererRoots: false,
        compatibilityClaimed: false
      };
    }
    function recordPrivatePostTaskRootContinuationExecutionRouteAbort(
      record,
      continuation,
      cancellation
    ) {
      var route = record.rootContinuationExecutionRoute;
      if (!route || route.continuationIndex !== continuation.continuationIndex) {
        return;
      }
      route.routeStatus =
        "aborted-before-private-root-continuation-execution";
      route.delayAbortOrdering = cancellation.delayAbortOrdering;
      route.abortOrdering = continuation.abortOrdering;
      route.abortSignal = cancellation.signalAfterAbort;
      var actRootWorkHandoff = createPrivatePostTaskActRootWorkHandoff(
        record,
        continuation,
        "aborted-before-private-root-continuation-execution",
        cancellation,
        cancellation.signalAfterAbort
      );
      route.hasActRootWorkHandoff = null !== actRootWorkHandoff;
      route.actRootWorkHandoff = actRootWorkHandoff;
      if (null !== actRootWorkHandoff) {
        record.actRootWorkHandoffDiagnostics = true;
        recordPrivatePostTaskContinuationMetadataActRootWorkHandoff(
          continuation,
          actRootWorkHandoff
        );
      }
      route.privateRootContinuationExecution =
        createPrivatePostTaskRootContinuationExecutionRecord(
          "aborted-before-private-root-continuation-execution",
          continuation,
          cancellation,
          cancellation.signalAfterAbort
        );
    }
    function describePrivatePostTaskEnvironmentCapabilities() {
      var windowValue = "object" === typeof window ? window : null,
        performanceValue = windowValue ? windowValue.performance : null,
        schedulerValue = scheduler;
      return {
        status: "controlled-task-scheduling-api-capability-snapshot",
        hasWindow: null !== windowValue,
        hasWindowPerformance:
          null !== performanceValue && "object" === typeof performanceValue,
        hasWindowPerformanceNow:
          !!performanceValue && "function" === typeof performanceValue.now,
        hasWindowSetTimeout:
          !!windowValue && "function" === typeof windowValue.setTimeout,
        hasTaskController: "function" === typeof TaskController,
        taskControllerConstructorName:
          "function" === typeof TaskController &&
          "string" === typeof TaskController.name
            ? TaskController.name
            : null,
        hasScheduler:
          !!schedulerValue &&
          ("object" === typeof schedulerValue ||
            "function" === typeof schedulerValue),
        hasSchedulerPostTask:
          !!schedulerValue && "function" === typeof schedulerValue.postTask,
        hasSchedulerYield:
          !!schedulerValue && "function" === typeof schedulerValue.yield,
        schedulerOwnKeys:
          schedulerValue && "object" === typeof schedulerValue
            ? Object.keys(schedulerValue)
            : [],
        browserPostTaskCompatibilityClaimed: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        compatibilityClaimed: false
      };
    }
    function describePrivatePostTaskPriorityMapping(
      priorityLevel,
      postTaskPriority
    ) {
      switch (priorityLevel) {
        case 1:
          var schedulerPriorityName = "unstable_ImmediatePriority",
            mappingReason = "immediate-and-user-blocking-map-to-user-blocking",
            recognizedPriority = true;
          break;
        case 2:
          schedulerPriorityName = "unstable_UserBlockingPriority";
          mappingReason = "immediate-and-user-blocking-map-to-user-blocking";
          recognizedPriority = true;
          break;
        case 3:
          schedulerPriorityName = "unstable_NormalPriority";
          mappingReason = "normal-and-low-map-to-user-visible";
          recognizedPriority = true;
          break;
        case 4:
          schedulerPriorityName = "unstable_LowPriority";
          mappingReason = "normal-and-low-map-to-user-visible";
          recognizedPriority = true;
          break;
        case 5:
          schedulerPriorityName = "unstable_IdlePriority";
          mappingReason = "idle-maps-to-background";
          recognizedPriority = true;
          break;
        default:
          schedulerPriorityName = "unknown";
          mappingReason = "unknown-priority-defaults-to-user-visible";
          recognizedPriority = false;
      }
      return {
        status: "scheduler-priority-to-post-task-priority-mapping",
        priorityLevel: priorityLevel,
        schedulerPriorityName: schedulerPriorityName,
        recognizedPriority: recognizedPriority,
        postTaskPriority: postTaskPriority,
        taskControllerPriority: postTaskPriority,
        mappingReason: mappingReason,
        browserPostTaskCompatibilityClaimed: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        compatibilityClaimed: false
      };
    }
    function describePrivatePostTaskDelay(postTaskOptions) {
      var delay = postTaskOptions.delay;
      return {
        hasDelayProperty: Object.prototype.hasOwnProperty.call(
          postTaskOptions,
          "delay"
        ),
        type: typeof delay,
        value: void 0 === delay ? null : delay,
        normalizedDelayType: typeof delay,
        normalizedDelayValue: void 0 === delay ? null : delay,
        delayClassification:
          "number" === typeof delay && 0 < delay
            ? "delayed-task"
            : "number" === typeof delay && 0 === delay
              ? "zero-delay-task"
              : "no-delay-value",
        browserPostTaskCompatibilityClaimed: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        compatibilityClaimed: false
      };
    }
    function describePrivatePostTaskContinuationStatus(record) {
      var callbackRunCount = record.callbackRuns.length,
        continuationFallbackCount = record.continuationFallbacks.length,
        lastCallbackRun =
          0 < callbackRunCount
            ? record.callbackRuns[callbackRunCount - 1]
            : null,
        lastContinuationFallback =
          0 < continuationFallbackCount
            ? record.continuationFallbacks[continuationFallbackCount - 1]
            : null;
      return {
        status:
          0 < continuationFallbackCount
            ? "continuation-fallback-scheduled"
            : 0 < callbackRunCount
              ? "callback-runs-without-continuation-fallback"
              : "no-callback-runs-before-abort",
        callbackRunCount: callbackRunCount,
        continuationFallbackCount: continuationFallbackCount,
        lastCallbackRunIndex: lastCallbackRun
          ? lastCallbackRun.runIndex
          : null,
        lastCallbackContinuationStatus: lastCallbackRun
          ? lastCallbackRun.continuationStatus
          : null,
        lastContinuationFallbackIndex: lastContinuationFallback
          ? lastContinuationFallback.continuationIndex
          : null,
        browserPostTaskCompatibilityClaimed: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        compatibilityClaimed: false
      };
    }
    function describePrivatePostTaskFallbackEnvironmentClassification(
      fallback
    ) {
      var hasSchedulerPostTask =
          !!scheduler && "function" === typeof scheduler.postTask,
        hasSchedulerYield = !!scheduler && "function" === typeof scheduler.yield,
        selectedFallback =
          null === fallback || void 0 === fallback
            ? hasSchedulerYield
              ? "scheduler.yield"
              : hasSchedulerPostTask
                ? "scheduler.postTask"
                : "none"
            : fallback,
        usesSchedulerYield = "scheduler.yield" === selectedFallback,
        usesSchedulerPostTaskFallback =
          "scheduler.postTask" === selectedFallback,
        classification =
          usesSchedulerYield && hasSchedulerYield
            ? "controlled-shim-scheduler-yield-continuation"
            : usesSchedulerPostTaskFallback && hasSchedulerPostTask
              ? "controlled-shim-scheduler-post-task-continuation"
              : "unsupported-continuation-fallback-environment";
      return {
        status: "controlled-shim-fallback-environment-classification",
        environmentKind: "controlled-task-scheduling-api-shim",
        classification: classification,
        selectedFallback: selectedFallback,
        hasSchedulerPostTask: hasSchedulerPostTask,
        hasSchedulerYield: hasSchedulerYield,
        usesSchedulerYield: usesSchedulerYield,
        usesSchedulerPostTaskFallback: usesSchedulerPostTaskFallback,
        browserPostTaskCompatibilityClaimed: false,
        browserTaskOrderingCompatibilityClaimed: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        compatibilityClaimed: false
      };
    }
    function describePrivatePostTaskContinuationSignalValidation(
      options,
      node,
      signalAtSchedule
    ) {
      var hasSignalProperty = Object.prototype.hasOwnProperty.call(
          options,
          "signal"
        ),
        signal = hasSignalProperty ? options.signal : null,
        hasSignal =
          !!signal &&
          ("object" === typeof signal || "function" === typeof signal),
        signalMatchesTaskController =
          hasSignal && signal === node._controller.signal,
        rejectionReason = hasSignal
          ? signalMatchesTaskController
            ? null
            : "mismatched-continuation-signal"
          : "missing-continuation-signal";
      return {
        status:
          null === rejectionReason
            ? "validated-shimmed-post-task-continuation-signal"
            : "invalid-shimmed-post-task-continuation-signal",
        signalSource: hasSignalProperty
          ? "continuationOptions.signal"
          : "missing-continuation-options-signal",
        hasSignalProperty: hasSignalProperty,
        hasSignal: hasSignal,
        signalMatchesTaskController: signalMatchesTaskController,
        signalId: signalAtSchedule.id,
        signalPriority: signalAtSchedule.priority,
        signalAbortedAtSchedule: signalAtSchedule.aborted,
        signalOwnKeys: signalAtSchedule.ownKeys,
        rejectionReason: rejectionReason,
        browserPostTaskCompatibilityClaimed: false,
        browserTaskOrderingCompatibilityClaimed: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        compatibilityClaimed: false
      };
    }
    function createPrivatePostTaskContinuationAbortOrdering(
      continuationIndex,
      sourceCallbackRunIndex,
      callbackRunCountAtSchedule,
      signalAtSchedule
    ) {
      return {
        status: "continuation-abort-ordering-pending-abort-call",
        requestEventIndex: null,
        completionEventIndex: null,
        continuationIndex: continuationIndex,
        sourceCallbackRunIndex: sourceCallbackRunIndex,
        callbackRunCountAtSchedule: callbackRunCountAtSchedule,
        callbackRunCountAtAbortRequest: null,
        callbackRunCountAtAbortCompletion: null,
        continuationFallbackCountAtSchedule: continuationIndex + 1,
        continuationFallbackCountAtAbortRequest: null,
        continuationFallbackCountAtAbortCompletion: null,
        signalAtSchedule: signalAtSchedule,
        signalBeforeAbort: null,
        signalAfterAbort: null,
        abortSignalStateAfterAbort: null,
        cancellationStatus: null,
        browserPostTaskCompatibilityClaimed: false,
        browserTaskOrderingCompatibilityClaimed: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        compatibilityClaimed: false
      };
    }
    function describePrivatePostTaskController(controller) {
      return {
        type: typeof controller,
        constructorName:
          controller &&
          controller.constructor &&
          "string" === typeof controller.constructor.name
            ? controller.constructor.name
            : null,
        ownKeys:
          controller && "object" === typeof controller
            ? Object.keys(controller)
            : []
      };
    }
    function describePrivatePostTaskSignal(signal) {
      return {
        id: signal && void 0 !== signal.id ? signal.id : null,
        priority:
          signal && void 0 !== signal.priority ? signal.priority : null,
        aborted: !!(signal && signal.aborted === true),
        ownKeys:
          signal && "object" === typeof signal ? Object.keys(signal) : []
      };
    }
    function describePrivatePostTaskContinuationOptions(options, node) {
      return {
        hasSignalProperty: Object.prototype.hasOwnProperty.call(
          options,
          "signal"
        ),
        hasDelayProperty: Object.prototype.hasOwnProperty.call(
          options,
          "delay"
        ),
        ownKeys:
          options && "object" === typeof options ? Object.keys(options) : [],
        signalMatchesTaskController:
          options.signal === node._controller.signal,
        signalAbortedAtSchedule: options.signal
          ? options.signal.aborted === true
          : null
      };
    }
    function claimPrivatePostTaskDiagnosticEventIndex(record) {
      return record.diagnosticEventSequence++;
    }
    function snapshotPrivatePostTaskPriorityRecord(record) {
      return freezePrivatePostTaskDiagnosticValue({
        status: record.status,
        version: record.version,
        exportName: record.exportName,
        symbolDescription: record.symbolDescription,
        entrypoint: record.entrypoint,
        compatibilityTarget: record.compatibilityTarget,
        diagnosticKind: record.diagnosticKind,
        diagnosticEventCount: record.diagnosticEventSequence,
        environmentCapabilities: record.environmentCapabilities,
        priorityMapping: record.priorityMapping,
        schedule: record.schedule,
        cancellation: record.cancellation,
        callbackRuns: record.callbackRuns,
        continuationFallbacks: record.continuationFallbacks,
        rootContinuationExecutionRoute:
          record.rootContinuationExecutionRoute,
        environmentCapabilityDiagnostics:
          record.environmentCapabilityDiagnostics,
        priorityMappingDiagnostics: record.priorityMappingDiagnostics,
        shimmedTaskControllerScheduling:
          record.shimmedTaskControllerScheduling,
        shimmedTaskControllerCancellation:
          record.shimmedTaskControllerCancellation,
        continuationFallbackDiagnostics:
          record.continuationFallbackDiagnostics,
        taskControllerAbortOrderingDiagnostics:
          record.taskControllerAbortOrderingDiagnostics,
        continuationFallbackMetadataDiagnostics:
          record.continuationFallbackMetadataDiagnostics,
        continuationSignalValidationDiagnostics:
          record.continuationSignalValidationDiagnostics,
        continuationAbortOrderingDiagnostics:
          record.continuationAbortOrderingDiagnostics,
        delayAbortOrderingDiagnostics:
          record.delayAbortOrderingDiagnostics,
        rootContinuationExecutionRouteDiagnostics:
          record.rootContinuationExecutionRouteDiagnostics,
        fallbackEnvironmentClassificationDiagnostics:
          record.fallbackEnvironmentClassificationDiagnostics,
        actRootWorkHandoffDiagnostics:
          record.actRootWorkHandoffDiagnostics,
        browserPostTaskCompatibilityClaimed:
          record.browserPostTaskCompatibilityClaimed,
        browserTaskOrderingCompatibilityClaimed:
          record.browserTaskOrderingCompatibilityClaimed,
        publicSchedulerTimingCompatibilityClaimed:
          record.publicSchedulerTimingCompatibilityClaimed,
        compatibilityClaimed: record.compatibilityClaimed
      });
    }
    function freezePrivatePostTaskDiagnosticValue(value) {
      var key, clone, index;
      if (Array.isArray(value)) {
        clone = [];
        for (index = 0; index < value.length; index++)
          clone.push(freezePrivatePostTaskDiagnosticValue(value[index]));
        return Object.freeze(clone);
      }
      if (null === value || "object" !== typeof value) {
        return value;
      }
      clone = {};
      var keys = Object.keys(value);
      for (index = 0; index < keys.length; index++) {
        key = keys[index];
        clone[key] = freezePrivatePostTaskDiagnosticValue(value[key]);
      }
      return Object.freeze(clone);
    }
    var perf = window.performance,
      setTimeout = window.setTimeout,
      scheduler = global.scheduler,
      getCurrentTime = perf.now.bind(perf),
      deadline = 0,
      currentPriorityLevel_DEPRECATED = 3,
      schedulerCompatibilityTarget = "scheduler@0.27.0",
      reactCompatibilityTarget = "react@19.2.6",
      privatePostTaskPriorityDiagnosticsExport =
        "__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__",
      privatePostTaskPriorityDiagnosticsSymbolDescription =
        "fast-react.scheduler.unstable_post_task.priority-diagnostics",
      privatePostTaskPriorityDiagnosticsSymbol = Symbol.for(
        privatePostTaskPriorityDiagnosticsSymbolDescription
      ),
      privatePostTaskPriorityDiagnosticsByNode = new WeakMap(),
      enablePrivatePostTaskPriorityDiagnostics =
        global.__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__ === true;
    exports.unstable_IdlePriority = 5;
    exports.unstable_ImmediatePriority = 1;
    exports.unstable_LowPriority = 4;
    exports.unstable_NormalPriority = 3;
    exports.unstable_Profiling = null;
    exports.unstable_UserBlockingPriority = 2;
    exports.unstable_cancelCallback = function (node) {
      var cancellation = recordPrivatePostTaskCancellationStart(node);
      node._controller.abort();
      recordPrivatePostTaskCancellationComplete(node, cancellation);
    };
    exports.unstable_forceFrameRate = function () {};
    exports.unstable_getCurrentPriorityLevel = function () {
      return currentPriorityLevel_DEPRECATED;
    };
    exports.unstable_next = function (callback) {
      switch (currentPriorityLevel_DEPRECATED) {
        case 1:
        case 2:
        case 3:
          var priorityLevel = 3;
          break;
        default:
          priorityLevel = currentPriorityLevel_DEPRECATED;
      }
      var previousPriorityLevel = currentPriorityLevel_DEPRECATED;
      currentPriorityLevel_DEPRECATED = priorityLevel;
      try {
        return callback();
      } finally {
        currentPriorityLevel_DEPRECATED = previousPriorityLevel;
      }
    };
    exports.unstable_now = getCurrentTime;
    exports.unstable_requestPaint = function () {};
    exports.unstable_runWithPriority = function (priorityLevel, callback) {
      var previousPriorityLevel = currentPriorityLevel_DEPRECATED;
      currentPriorityLevel_DEPRECATED = priorityLevel;
      try {
        return callback();
      } finally {
        currentPriorityLevel_DEPRECATED = previousPriorityLevel;
      }
    };
    exports.unstable_scheduleCallback = function (
      priorityLevel,
      callback,
      options
    ) {
      switch (priorityLevel) {
        case 1:
        case 2:
          var postTaskPriority = "user-blocking";
          break;
        case 4:
        case 3:
          postTaskPriority = "user-visible";
          break;
        case 5:
          postTaskPriority = "background";
          break;
        default:
          postTaskPriority = "user-visible";
      }
      var controller = new TaskController({ priority: postTaskPriority });
      options = {
        delay:
          "object" === typeof options && null !== options ? options.delay : 0,
        signal: controller.signal
      };
      controller = { _controller: controller };
      enablePrivatePostTaskPriorityDiagnostics &&
        attachPrivatePostTaskPriorityDiagnostics(
          controller,
          createPrivatePostTaskPriorityRecord(
            priorityLevel,
            postTaskPriority,
            options,
            controller._controller
          )
        );
      scheduler
        .postTask(
          runTask.bind(
            null,
            priorityLevel,
            postTaskPriority,
            controller,
            callback
          ),
          options
        )
        .catch(handleAbortError);
      return controller;
    };
    exports.unstable_shouldYield = function () {
      return getCurrentTime() >= deadline;
    };
    exports.unstable_wrapCallback = function (callback) {
      var parentPriorityLevel = currentPriorityLevel_DEPRECATED;
      return function () {
        var previousPriorityLevel = currentPriorityLevel_DEPRECATED;
        currentPriorityLevel_DEPRECATED = parentPriorityLevel;
        try {
          return callback();
        } finally {
          currentPriorityLevel_DEPRECATED = previousPriorityLevel;
        }
      };
    };
  })();
