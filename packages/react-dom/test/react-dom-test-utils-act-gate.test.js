'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');

const packageRoot = path.resolve(__dirname, '..');
const testUtils = require(path.join(packageRoot, 'test-utils.js'));
const gateModule = require(path.join(
  packageRoot,
  'src/test-utils-act-gate.js'
));
const worker810LedgerModuleUrl = pathToFileURL(
  path.resolve(
    packageRoot,
    '../../tests/conformance/src/private-admission-810-react-act-scheduler-diagnostics-ledger.mjs'
  )
).href;
const {
  createSourceOwnedReactDomLifecycleBoundary
} = require(path.resolve(
  packageRoot,
  '../../tests/conformance/src/react-dom-source-owned-lifecycle-boundary.cjs'
));
const reactPrivateActDispatcherGatePath = path.resolve(
  packageRoot,
  '../react/private-act-dispatcher-gate.js'
);
const schedulerMockPath = path.resolve(
  packageRoot,
  '../scheduler/unstable_mock.js'
);
const schedulerMockCjsDevelopmentPath = path.resolve(
  packageRoot,
  '../scheduler/cjs/scheduler-unstable_mock.development.js'
);
const schedulerMockCjsProductionPath = path.resolve(
  packageRoot,
  '../scheduler/cjs/scheduler-unstable_mock.production.js'
);
const privateActQueueFlushDiagnosticsExport =
  '__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__';
const privateSchedulerMockDelayedActRootWorkDiagnosticsKind =
  'fast-react.scheduler.mock-delayed-act-root-work-diagnostics';
const privateSchedulerMockDelayedActRootWorkDiagnosticsBrand = Symbol.for(
  privateSchedulerMockDelayedActRootWorkDiagnosticsKind
);
const privateSchedulerMockExpiredActRootWorkMetadataKind =
  'fast-react.scheduler.mock-expired-act-root-work-metadata';
const privateSchedulerMockExpiredActRootWorkMetadataBrand = Symbol.for(
  privateSchedulerMockExpiredActRootWorkMetadataKind
);
const privateSchedulerMockExpiredActRootWorkDiagnosticsKind =
  'fast-react.scheduler.mock-expired-act-root-work-diagnostics';
const privateSchedulerMockExpiredActRootWorkDiagnosticsBrand = Symbol.for(
  privateSchedulerMockExpiredActRootWorkDiagnosticsKind
);
const privateSchedulerDrivenPassiveEffectDiagnosticsKind =
  'fast-react.react.private-scheduler-driven-passive-effect-diagnostics';
const privateSchedulerDrivenPassiveEffectDiagnosticsBrand = Symbol.for(
  privateSchedulerDrivenPassiveEffectDiagnosticsKind
);
const acceptedSchedulerMockExpiredActRootWorkRecords = Object.freeze([
  'RootLaneSchedulingSnapshot',
  'UpdateContainerResult',
  'RootScheduleUpdateRecord',
  'RootTaskScheduleRecord',
  'SchedulerCallbackRequest',
  'RootSchedulerCallbackExecutionRecord',
  'HostRootFinishedWorkPendingCommitRecordForCanary',
  'HostRootFinishedWorkCommitHandoffRecordForCanary'
]);

test('react-dom/test-utils act placeholder remains blocked before callback execution', () => {
  let callbackInvoked = false;

  assert.throws(
    () =>
      testUtils.act(() => {
        callbackInvoked = true;
      }),
    (error) => {
      assert.equal(error.name, 'FastReactDomUnimplementedError');
      assert.equal(error.code, 'FAST_REACT_UNIMPLEMENTED');
      assert.equal(error.entrypoint, 'react-dom/test-utils');
      assert.equal(error.exportName, 'act');
      assert.equal(error.compatibilityTarget, 'react-dom@19.2.6');
      return true;
    }
  );
  assert.equal(callbackInvoked, false);
});

test('private act gate recognizes passive and root-output diagnostics without opening public act', () => {
  const gate = gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate();

  assert.equal(gate.id, 'react-dom-test-utils-act-private-routing-gate-5');
  assert.equal(gate.publicTestUtilsActReady, false);
  assert.equal(gate.publicReactActReady, false);
  assert.equal(gate.privateRoutingReady, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);

  assert.deepEqual(gate.privatePassiveDiagnostics.acceptedDiagnosticIds, [
    'passive-effects-committed-fiber-traversal',
    'passive-effects-scheduler-flush-diagnostic',
    'passive-effect-mount-unmount-execution-diagnostics',
    'passive-effect-root-error-routing-diagnostics',
    'scheduler-driven-passive-effect-execution-diagnostics'
  ]);
  assert.equal(gate.privatePassiveDiagnostics.publicActPassiveDrain, false);
  assert.equal(gate.privatePassiveDiagnostics.publicEffectExecution, false);
  assert.equal(
    gate.privatePassiveDiagnostics.schedulerDrivenPassiveExecution,
    false
  );
  assert.equal(
    gate.privatePassiveDiagnostics.summary.privateSchedulerDrivenPassiveExecution,
    true
  );
  assert.equal(
    gate.privatePassiveDiagnostics.publicRootErrorCallbacksInvoked,
    false
  );
  assert.equal(gate.privatePassiveDiagnostics.publicActErrorAggregation, false);
  assert.equal(gate.privatePassiveDiagnostics.compatibilityClaimed, false);
  assert.deepEqual(
    gate.privatePassivePrerequisitesStillBlocked,
    gate.blockedPrivatePassivePrerequisiteIds
  );

  assert.deepEqual(gate.reactDomRootBridge.privateHostOutputDiagnostics.scenarios, [
    'create-root-no-render',
    'initial-host-render',
    'update-host-render',
    'replace-host-tree',
    'render-null-clears-container',
    'root-unmount',
    'double-unmount',
    'render-after-unmount',
    'flush-sync-cross-root-render'
  ]);
  assert.deepEqual(
    gate.reactDomRootBridge.privateHostOutputDiagnostics.blockedPrerequisiteIds,
    gate.blockedPrivateRootHostOutputPrerequisiteIds
  );
  assert.equal(
    gate.reactDomRootBridge.privateHostOutputDiagnostics.publicActExecution,
    false
  );
  assert.equal(gate.reactDomRootBridge.publicWarningCompatibility, false);
  assert.equal(gate.sideEffectPolicy.invokesActCallback, false);
  assert.equal(gate.sideEffectPolicy.executesPassiveEffects, false);
  assert.equal(gate.sideEffectPolicy.executesPublicRendererRoots, false);
});

test('private act gate consumes Worker 810 ledger shape without opening public act', async () => {
  const worker810Ledger = await import(worker810LedgerModuleUrl);
  const gate = gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate();
  const ledger = gate.privateReactActSchedulerDiagnosticsLedger;
  const prerequisite = gate.acceptedPrivatePrerequisites.find(
    (candidate) =>
      candidate.id ===
      gateModule.privateReactActSchedulerDiagnosticsLedgerPrerequisiteId
  );

  assert.notEqual(prerequisite, undefined);
  assert.equal(
    ledger.gateId,
    worker810Ledger.PRIVATE_ADMISSION_810_GATE_ID
  );
  assert.equal(
    ledger.status,
    worker810Ledger.PRIVATE_ADMISSION_810_GATE_STATUS
  );
  assert.deepEqual(
    ledger.workerIds,
    worker810Ledger.PRIVATE_ADMISSION_810_WORKERS
  );
  assert.deepEqual(
    ledger.evidenceKinds,
    worker810Ledger.PRIVATE_ADMISSION_810_WORKERS.map(
      (workerId) =>
        worker810Ledger.PRIVATE_ADMISSION_810_REQUIRED_EVIDENCE_KINDS[
          workerId
        ]
    )
  );
  assert.deepEqual(
    ledger.delayedRendererRootEvidenceScopes,
    worker810Ledger.PRIVATE_ADMISSION_810_WORKERS.map(
      (workerId) =>
        worker810Ledger.PRIVATE_ADMISSION_810_REQUIRED_RENDERER_ROOT_SCOPES[
          workerId
        ]
    )
  );
  assert.equal(ledger.staticReadOnlyLedger, true);
  assert.equal(ledger.sourceTokenChecksOnly, true);
  assert.equal(ledger.manifestEvaluationOnly, true);
  assert.equal(ledger.schedulerOwnedDiagnosticsRecognized, true);
  assert.equal(ledger.sourceValidatorOwnedByScheduler, true);
  assert.equal(ledger.schedulerValidatorPrivateDiagnosticsOnly, true);
  assert.equal(ledger.rejectsStaleWorkerLedgerMetadata, true);
  assert.equal(ledger.rejectsForeignWorkerLedgerMetadata, true);
  assert.equal(ledger.rejectsTamperedPublicClaims, true);
  assert.equal(ledger.publicActReady, false);
  assert.equal(ledger.publicTestUtilsActReady, false);
  assert.equal(ledger.publicSchedulerTimingReady, false);
  assert.equal(ledger.publicSchedulerFlushBehaviorExecuted, false);
  assert.equal(ledger.publicActExecution, false);
  assert.equal(ledger.publicRootExecution, false);
  assert.equal(ledger.publicEffectExecution, false);
  assert.equal(ledger.executesEffects, false);
  assert.equal(ledger.executesRendererRoots, false);
  assert.equal(ledger.compatibilityClaimed, false);
  assert.deepEqual(prerequisite.publicBlockerClaims, ledger.publicBlockerClaims);
});

test('private act gate preflights delayed Scheduler diagnostics through nested expired consumption', () => {
  const gate = gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate();
  const prerequisite = gate.acceptedPrivatePrerequisites.find(
    (candidate) =>
      candidate.id ===
      gateModule.privateSchedulerMockDelayedActRootWorkPrerequisiteId
  );

  assert.equal(
    gate.acceptedPrivatePrerequisiteIds.includes(
      gateModule.privateSchedulerMockDelayedActRootWorkPrerequisiteId
    ),
    true
  );
  assert.notEqual(prerequisite, undefined);
  assert.equal(
    prerequisite.status,
    gateModule.privateSchedulerMockDelayedActRootWorkDiagnosticStatus
  );
  assert.equal(prerequisite.present, true);
  assert.equal(prerequisite.privateDiagnostic, true);
  assert.equal(
    prerequisite.diagnosticGateId,
    gateModule.privateSchedulerMockDelayedActRootWorkDiagnosticGateId
  );
  assert.equal(
    prerequisite.preflightsSchedulerMockDelayedActRootWorkDiagnostics,
    true
  );
  assert.equal(prerequisite.consumesNestedExpiredActRootWorkDiagnostics, true);
  assert.equal(
    prerequisite.acceptsTopLevelDelayedActRootWorkAsPublicActEvidence,
    false
  );
  assert.equal(prerequisite.publicSchedulerFlushBehaviorExecuted, false);
  assert.equal(prerequisite.executesRendererRoots, false);

  for (const nodeEnv of ['development', 'production']) {
    const {
      Scheduler,
      actQueue,
      events,
      getPublicSchedulerCallbackRan,
      reactGate,
      report
    } = createSchedulerMockDelayedActRootWorkDiagnostics(nodeEnv);

    assert.equal(
      report[privateSchedulerMockDelayedActRootWorkDiagnosticsBrand],
      true,
      nodeEnv
    );
    assert.equal(Object.isFrozen(report), true, nodeEnv);
    assert.equal(
      report.kind,
      privateSchedulerMockDelayedActRootWorkDiagnosticsKind,
      nodeEnv
    );
    assert.equal(
      report.expiredActRootWorkDrainReport[
        privateSchedulerMockExpiredActRootWorkDiagnosticsBrand
      ],
      true,
      nodeEnv
    );
    assert.equal(
      gateModule.isAcceptedSchedulerMockDelayedActRootWorkDiagnostics(report),
      true,
      nodeEnv
    );
    assert.equal(
      gateModule.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(report),
      false,
      nodeEnv
    );

    const preflight =
      gateModule.preflightSchedulerMockDelayedActRootWorkDiagnostics(report);
    assert.equal(
      preflight.status,
      gateModule.privateSchedulerMockDelayedActRootWorkPreflightStatus,
      nodeEnv
    );
    assert.equal(
      preflight.gateId,
      gateModule.privateSchedulerMockDelayedActRootWorkDiagnosticGateId,
      nodeEnv
    );
    assert.equal(
      preflight.reactActPreflightStatus,
      reactGate.schedulerMockDelayedActRootWorkPreflightStatus,
      nodeEnv
    );
    assert.equal(
      preflight.schedulerMockDelayedActRootWorkDiagnosticsStatus,
      reactGate.schedulerMockDelayedActRootWorkDiagnosticsStatus,
      nodeEnv
    );
    assert.equal(
      preflight.schedulerMockDelayedActRootWorkDiagnosticKind,
      privateSchedulerMockDelayedActRootWorkDiagnosticsKind,
      nodeEnv
    );
    assert.equal(
      preflight.schedulerMockExpiredActRootWorkDiagnosticKind,
      privateSchedulerMockExpiredActRootWorkDiagnosticsKind,
      nodeEnv
    );
    assert.equal(preflight.selectedFlushHelper, 'unstable_flushExpired');
    assert.equal(preflight.delayedCallbackDelayMs, 10, nodeEnv);
    assert.equal(preflight.delayedCallbackVirtualTimeBefore, 0, nodeEnv);
    assert.equal(
      preflight.delayedCallbackVirtualTimeAfterPromotion,
      260,
      nodeEnv
    );
    assert.equal(preflight.delayedCallbackAdvanceTimeBy, 260, nodeEnv);
    assert.equal(
      preflight.delayedActRootWorkProducerKind,
      'accepted-root-metadata',
      nodeEnv
    );
    assert.equal(
      preflight.nestedExpiredActRootWorkConsumption.status,
      gateModule.privateSchedulerMockExpiredActRootWorkConsumptionStatus,
      nodeEnv
    );
    assert.equal(
      preflight.nestedExpiredActRootWorkConsumption.reactActConsumptionStatus,
      reactGate.schedulerMockExpiredActRootWorkConsumptionStatus,
      nodeEnv
    );
    assert.equal(
      preflight.rootWorkRecordSummary.recordCount,
      acceptedSchedulerMockExpiredActRootWorkRecords.length,
      nodeEnv
    );
    assert.equal(preflight.rootWorkRecordSummary.remainingCount, 0, nodeEnv);
    assert.equal(preflight.actQueueDrainSummary.pendingBefore, 2, nodeEnv);
    assert.equal(preflight.actQueueDrainSummary.remainingCount, 0, nodeEnv);
    assert.equal(
      preflight.acceptsTopLevelDelayedActRootWorkAsPublicActEvidence,
      false,
      nodeEnv
    );
    assert.equal(preflight.publicReactActReady, false, nodeEnv);
    assert.equal(preflight.publicTestUtilsActReady, false, nodeEnv);
    assert.equal(preflight.publicSchedulerFlushBehaviorExecuted, false, nodeEnv);
    assert.equal(preflight.drainsPublicSchedulerTaskQueue, false, nodeEnv);
    assert.equal(preflight.drainsPublicReactActQueue, false, nodeEnv);
    assert.equal(preflight.executesEffects, false, nodeEnv);
    assert.equal(preflight.executesRendererRoots, false, nodeEnv);
    assert.equal(actQueue.records.length, 0, nodeEnv);
    assert.equal(Scheduler.unstable_hasPendingWork(), true, nodeEnv);
    assert.equal(getPublicSchedulerCallbackRan(), false, nodeEnv);
    assert.deepEqual(
      events.map((event) => event[0]),
      [
        'delayed-act-root-callback',
        'delayed-act-root-continuation',
        'act-root-schedule',
        'act-root-callback',
        'act-root-continuation'
      ],
      nodeEnv
    );

    for (const { diagnostics, reason, label } of [
      {
        label: 'top-level-clone',
        diagnostics: cloneDelayedActRootWorkReport(report),
        reason: 'scheduler-delayed-act-root-diagnostics-source-proof'
      },
      {
        label: 'missing-brand',
        diagnostics: cloneDelayedActRootWorkReport(report, {}, {
          withBrand: false
        }),
        reason: 'scheduler-delayed-act-root-diagnostics-brand'
      },
      {
        label: 'nested-expired-clone',
        diagnostics: cloneDelayedActRootWorkReport(report, {
          expiredActRootWorkDrainReport: cloneExpiredActRootWorkReport(
            report.expiredActRootWorkDrainReport
          )
        }),
        reason: 'scheduler-delayed-act-root-diagnostics-nested-expired'
      },
      {
        label: 'public-react-act-claim',
        diagnostics: cloneDelayedActRootWorkReport(report, {
          publicReactActCompatibilityClaimed: true
        }),
        reason: 'scheduler-delayed-act-root-diagnostics-public-claim'
      }
    ]) {
      assertReactDomDelayedSchedulerDiagnosticsRejected(
        gateModule,
        diagnostics,
        reason,
        `${nodeEnv}:${label}`
      );
    }

    Scheduler.reset();
  }
});

test('private act gate rejects Scheduler-first delayed diagnostics that only hit require cache', () => {
  for (const nodeEnv of ['development', 'production']) {
    const { Scheduler, report } =
      createSchedulerMockDelayedActRootWorkDiagnostics(nodeEnv, {
        schedulerFirstCacheHit: true
      });

    assert.equal(
      report[privateSchedulerMockDelayedActRootWorkDiagnosticsBrand],
      true,
      nodeEnv
    );
    assertReactDomDelayedSchedulerDiagnosticsRejected(
      gateModule,
      report,
      'scheduler-delayed-act-root-diagnostics-metadata',
      `${nodeEnv}:scheduler-first-cache-hit`
    );

    Scheduler.reset();
  }
});

test('private act gate validates delayed Scheduler prerequisite manifest and public claims', () => {
  const gate = gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate();
  const baseline = gate.acceptedPrivatePrerequisites.find(
    (candidate) =>
      candidate.id ===
      gateModule.privateSchedulerMockDelayedActRootWorkPrerequisiteId
  );

  assert.notEqual(baseline, undefined);

  const missing = gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
    acceptedPrivatePrerequisites: gate.acceptedPrivatePrerequisites.filter(
      (prerequisite) =>
        prerequisite.id !==
        gateModule.privateSchedulerMockDelayedActRootWorkPrerequisiteId
    )
  });
  assert.equal(
    missing.status,
    'blocked-public-test-utils-act-private-routing-with-violations'
  );
  assert.deepEqual(missing.violations, [
    {
      id: 'accepted-private-prerequisite-manifest-mismatch',
      missingPrerequisiteIds: [
        gateModule.privateSchedulerMockDelayedActRootWorkPrerequisiteId
      ],
      unexpectedPrerequisiteIds: [],
      duplicatePrerequisiteIds: []
    }
  ]);

  const stale = gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
    acceptedPrivatePrerequisites: replacePrerequisite(
      gate.acceptedPrivatePrerequisites,
      {
        ...baseline,
        workerId:
          'worker-835-foreign-react-dom-test-utils-delayed-scheduler',
        preflightsSchedulerMockDelayedActRootWorkDiagnostics: false,
        records: baseline.records.slice(1)
      }
    )
  });
  assert.equal(
    stale.status,
    'blocked-public-test-utils-act-private-routing-with-violations'
  );
  assert.deepEqual(stale.violations, [
    {
      id: 'accepted-private-prerequisite-stale-evidence',
      prerequisites: [
        {
          prerequisiteId:
            gateModule.privateSchedulerMockDelayedActRootWorkPrerequisiteId,
          reasons: [
            'worker-id-mismatch',
            'records-mismatch',
            'preflightsSchedulerMockDelayedActRootWorkDiagnostics-not-true'
          ]
        }
      ]
    }
  ]);

  const publicClaim =
    gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
      acceptedPrivatePrerequisites: replacePrerequisite(
        gate.acceptedPrivatePrerequisites,
        {
          ...baseline,
          publicReactActCompatibilityClaimed: true,
          summary: {
            ...baseline.summary,
            publicSchedulerFlushBehaviorExecuted: true
          }
        }
      )
    });
  assert.equal(
    publicClaim.status,
    'blocked-public-test-utils-act-private-routing-with-violations'
  );
  assert.deepEqual(publicClaim.violations, [
    {
      id: 'accepted-private-prerequisite-stale-evidence',
      prerequisites: [
        {
          prerequisiteId:
            gateModule.privateSchedulerMockDelayedActRootWorkPrerequisiteId,
          reasons: [
            'publicReactActCompatibilityClaimed-not-false',
            'summary.publicSchedulerFlushBehaviorExecuted-not-false'
          ]
        }
      ]
    },
    {
      id: 'accepted-private-prerequisite-public-claim-detected',
      claims: [
        {
          prerequisiteId:
            gateModule.privateSchedulerMockDelayedActRootWorkPrerequisiteId,
          field: 'publicReactActCompatibilityClaimed'
        },
        {
          prerequisiteId:
            gateModule.privateSchedulerMockDelayedActRootWorkPrerequisiteId,
          field: 'summary.publicSchedulerFlushBehaviorExecuted'
        }
      ]
    }
  ]);
  assert.equal(publicClaim.publicTestUtilsActReady, false);
  assert.equal(publicClaim.sideEffectPolicy.executesRendererRoots, false);
});

test('private act gate rejects stale foreign or tampered Worker 810 ledger metadata', () => {
  const gate = gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate();
  const baseline = gate.acceptedPrivatePrerequisites.find(
    (candidate) =>
      candidate.id ===
      gateModule.privateReactActSchedulerDiagnosticsLedgerPrerequisiteId
  );

  assert.notEqual(baseline, undefined);

  const cases = [
    {
      label: 'stale-status',
      prerequisite: {
        ...baseline,
        status:
          'recognized-react-act-scheduler-private-diagnostics-ledger-stale',
        privateDiagnosticsRecognized: false,
        requirements: {
          ...baseline.requirements,
          staticReadOnlyLedger: false
        }
      },
      staleReasons: [
        'status-mismatch',
        'privateDiagnosticsRecognized-not-true',
        'requirements.staticReadOnlyLedger-mismatch'
      ],
      publicClaimFields: []
    },
    {
      label: 'foreign-worker-manifest',
      prerequisite: {
        ...baseline,
        workerId: 'worker-822-foreign-react-act-scheduler-ledger',
        workerIds: [
          ...baseline.workerIds.slice(0, -1),
          'worker-822-foreign-react-act-scheduler-ledger'
        ]
      },
      staleReasons: ['worker-id-mismatch', 'worker-ids-mismatch'],
      publicClaimFields: []
    },
    {
      label: 'nested-summary-foreign-worker',
      prerequisite: {
        ...baseline,
        summary: {
          ...baseline.summary,
          workerId: 'worker-822-foreign-react-act-scheduler-ledger'
        }
      },
      staleReasons: ['summary.worker-id-mismatch'],
      publicClaimFields: []
    },
    {
      label: 'nested-summary-public-execution',
      prerequisite: {
        ...baseline,
        summary: {
          ...baseline.summary,
          publicActExecution: true
        }
      },
      staleReasons: ['summary.publicActExecution-not-false'],
      publicClaimFields: ['summary.publicActExecution']
    },
    {
      label: 'nested-summary-public-blocker-claim',
      prerequisite: {
        ...baseline,
        summary: {
          ...baseline.summary,
          publicBlockerClaims: {
            ...baseline.summary.publicBlockerClaims,
            publicActExecution: true
          }
        }
      },
      staleReasons: ['summary.publicBlockerClaims.publicActExecution-not-false'],
      publicClaimFields: ['summary.publicBlockerClaims.publicActExecution']
    },
    {
      label: 'tampered-public-claims',
      prerequisite: {
        ...baseline,
        publicCompatibilityClaimed: true,
        publicTestUtilsActReady: true,
        publicSchedulerTimingReady: true,
        publicReactActCompatibilityClaimed: true,
        publicSchedulerFlushBehaviorExecuted: true,
        packageSurfaceChanged: true,
        publicRootExecution: true,
        publicEffectExecution: true,
        executesRendererRoots: true,
        publicBlockerClaims: {
          ...baseline.publicBlockerClaims,
          publicTestUtilsActReady: true,
          publicReactActCompatibilityClaimed: true,
          publicSchedulerFlushBehaviorExecuted: true,
          packageSurfaceChanged: true,
          publicRootExecution: true,
          publicEffectExecution: true,
          executesRendererRoots: true
        }
      },
      staleReasons: [
        'publicCompatibilityClaimed-not-false',
        'publicTestUtilsActReady-not-false',
        'publicSchedulerTimingReady-not-false',
        'packageSurfaceChanged-not-false',
        'publicReactActCompatibilityClaimed-not-false',
        'publicSchedulerFlushBehaviorExecuted-not-false',
        'publicRootExecution-not-false',
        'publicEffectExecution-not-false',
        'executesRendererRoots-not-false',
        'publicBlockerClaims.publicTestUtilsActReady-not-false',
        'publicBlockerClaims.publicReactActCompatibilityClaimed-not-false',
        'publicBlockerClaims.publicSchedulerFlushBehaviorExecuted-not-false',
        'publicBlockerClaims.packageSurfaceChanged-not-false',
        'publicBlockerClaims.publicRootExecution-not-false',
        'publicBlockerClaims.publicEffectExecution-not-false',
        'publicBlockerClaims.executesRendererRoots-not-false'
      ],
      publicClaimFields: [
        'publicCompatibilityClaimed',
        'publicTestUtilsActReady',
        'publicSchedulerTimingReady',
        'publicReactActCompatibilityClaimed',
        'publicSchedulerFlushBehaviorExecuted',
        'packageSurfaceChanged',
        'publicRootExecution',
        'publicEffectExecution',
        'executesRendererRoots',
        'publicBlockerClaims.publicTestUtilsActReady',
        'publicBlockerClaims.publicReactActCompatibilityClaimed',
        'publicBlockerClaims.publicSchedulerFlushBehaviorExecuted',
        'publicBlockerClaims.packageSurfaceChanged',
        'publicBlockerClaims.publicRootExecution',
        'publicBlockerClaims.publicEffectExecution',
        'publicBlockerClaims.executesRendererRoots'
      ]
    }
  ];

  for (const { label, prerequisite, staleReasons, publicClaimFields } of cases) {
    const evaluated =
      gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
        acceptedPrivatePrerequisites: replacePrerequisite(
          gate.acceptedPrivatePrerequisites,
          prerequisite
        )
      });
    const stale = evaluated.stalePrivatePrerequisites.find(
      (candidate) =>
        candidate.prerequisiteId ===
        gateModule.privateReactActSchedulerDiagnosticsLedgerPrerequisiteId
    );

    assert.equal(
      evaluated.status,
      'blocked-public-test-utils-act-private-routing-with-violations',
      label
    );
    assert.notEqual(stale, undefined, label);
    assertIncludesAll(staleReasons, stale.reasons, label);
    assertIncludesAll(
      ['accepted-private-prerequisite-stale-evidence'],
      evaluated.violations.map((violation) => violation.id),
      label
    );
    assert.deepEqual(
      evaluated.privatePrerequisitePublicClaims.map(
        (claim) => claim.prerequisiteId
      ),
      publicClaimFields.map(
        () => gateModule.privateReactActSchedulerDiagnosticsLedgerPrerequisiteId
      ),
      label
    );
    assertIncludesAll(
      publicClaimFields,
      evaluated.privatePrerequisitePublicClaims.map((claim) => claim.field),
      label
    );
    assert.equal(evaluated.publicCompatibilityClaimed, false, label);
    assert.equal(evaluated.publicReactActReady, false, label);
    assert.equal(evaluated.publicTestUtilsActReady, false, label);
    assert.deepEqual(
      evaluated.publicPrerequisitesStillBlocked,
      evaluated.blockedPublicPrerequisiteIds,
      label
    );
    assert.equal(evaluated.sideEffectPolicy.invokesActCallback, false, label);
    assert.equal(evaluated.sideEffectPolicy.executesQueuedWork, false, label);
    assert.equal(evaluated.sideEffectPolicy.executesPassiveEffects, false, label);
    assert.equal(evaluated.sideEffectPolicy.executesRendererRoots, false, label);
    assert.equal(
      evaluated.sideEffectPolicy.executesPublicRendererRoots,
      false,
      label
    );
  }
});

test('private act gate prevents gateOverride tampering of Worker 810 ledger surface', () => {
  const baseline = gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate();
  const evaluated = gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
    gateOverrides: {
      privateReactActSchedulerDiagnosticsLedger: {
        ...baseline.privateReactActSchedulerDiagnosticsLedger,
        summary: {
          ...baseline.privateReactActSchedulerDiagnosticsLedger.summary,
          publicActExecution: true,
          publicReactActCompatibilityClaimed: true,
          packageSurfaceChanged: true,
          publicBlockerClaims: {
            ...baseline.privateReactActSchedulerDiagnosticsLedger.summary
              .publicBlockerClaims,
            publicActExecution: true,
            publicReactActCompatibilityClaimed: true,
            packageSurfaceChanged: true
          }
        }
      }
    }
  });

  assert.deepEqual(evaluated.violations, []);
  assert.deepEqual(evaluated.privatePrerequisitePublicClaims, []);
  assert.deepEqual(evaluated.stalePrivatePrerequisites, []);
  assert.equal(
    evaluated.privateReactActSchedulerDiagnosticsLedger.summary
      .publicActExecution,
    false
  );
  assert.equal(
    evaluated.privateReactActSchedulerDiagnosticsLedger.summary
      .publicReactActCompatibilityClaimed,
    false
  );
  assert.equal(
    evaluated.privateReactActSchedulerDiagnosticsLedger.summary
      .packageSurfaceChanged,
    false
  );
  assert.equal(
    evaluated.privateReactActSchedulerDiagnosticsLedger.summary
      .publicBlockerClaims.publicActExecution,
    false
  );
  assert.equal(
    evaluated.privateReactActSchedulerDiagnosticsLedger.summary
      .publicBlockerClaims.publicReactActCompatibilityClaimed,
    false
  );
  assert.equal(
    evaluated.privateReactActSchedulerDiagnosticsLedger.summary
      .publicBlockerClaims.packageSurfaceChanged,
    false
  );
  assert.equal(evaluated.publicTestUtilsActReady, false);
  assert.equal(evaluated.sideEffectPolicy.executesRendererRoots, false);
});

test('private act gate consumes scheduler-driven passive diagnostics through React private act only', () => {
  for (const nodeEnv of ['development', 'production']) {
    const lifecycle =
      createSourceOwnedReactDomLifecycleBoundary(
        `test-utils-passive-${nodeEnv}`
      );
    const { reactGate, report } =
      createSchedulerMockDelayedActRootWorkDiagnostics(nodeEnv, {
        rootId: lifecycle.rootId,
        rootLabel: lifecycle.rootLabel
      });
    const expiredReport = report.expiredActRootWorkDrainReport;
    const passiveDiagnostics =
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        expiredReport,
        {
          ...lifecycle.boundaryOptions,
          finishedWorkId: `test-utils-passive-${nodeEnv}`
        }
      );

    assert.equal(
      passiveDiagnostics[privateSchedulerDrivenPassiveEffectDiagnosticsBrand],
      true,
      nodeEnv
    );
    assert.equal(
      gateModule.isAcceptedSchedulerDrivenPassiveEffectDiagnostics(
        passiveDiagnostics
      ),
      true,
      nodeEnv
    );

    const consumption =
      gateModule.consumeSchedulerDrivenPassiveEffectDiagnostics(
        passiveDiagnostics
      );
    assert.equal(
      consumption.status,
      gateModule.privateSchedulerDrivenPassiveEffectConsumptionStatus,
      nodeEnv
    );
    assert.equal(
      consumption.gateId,
      gateModule.privateSchedulerDrivenPassiveEffectDiagnosticGateId,
      nodeEnv
    );
    assert.equal(
      consumption.reactActConsumptionStatus,
      reactGate.schedulerDrivenPassiveEffectConsumptionStatus,
      nodeEnv
    );
    assert.equal(consumption.requiresSchedulerOwnedSourceProof, true, nodeEnv);
    assert.equal(consumption.requiresSourceOwnedPassiveEvidence, true, nodeEnv);
    assert.equal(
      consumption.requiresSourceOwnedActiveLifecycleRequestBoundary,
      true,
      nodeEnv
    );
    assert.equal(
      consumption.consumesRootLifecycleRequestBoundary,
      true,
      nodeEnv
    );
    assert.equal(consumption.validatesLifecycleRequestRootIdentity, true, nodeEnv);
    assert.equal(consumption.validatesLifecycleRequestOrdering, true, nodeEnv);
    assert.equal(consumption.validatesLifecycleRequestEntrypoint, true, nodeEnv);
    assert.equal(Object.isFrozen(consumption.lifecycleRequestBoundary), true, nodeEnv);
    assert.equal(
      consumption.lifecycleRequestBoundaryStatus,
      gateModule.privateSchedulerDrivenPassiveLifecycleBoundaryStatus,
      nodeEnv
    );
    assert.equal(
      consumption.lifecycleRequestBoundary.snapshotStatus,
      gateModule.privateSchedulerDrivenPassiveLifecycleBoundaryStatus,
      nodeEnv
    );
    assert.equal(
      consumption.lifecycleRequestBoundary.kind,
      gateModule.privateSchedulerDrivenPassiveLifecycleBoundaryKind,
      nodeEnv
    );
    assert.equal(
      consumption.lifecycleRequestBoundary.sourceRequestId,
      lifecycle.boundary.sourceRequestId,
      nodeEnv
    );
    assert.equal(
      consumption.linksRootCommitPassiveExecutionToActFlushDiagnostics,
      true,
      nodeEnv
    );
    assert.equal(consumption.privateSchedulerDrivenPassiveExecution, true, nodeEnv);
    assert.equal(consumption.didExecutePrivateCallbackExecutors, true, nodeEnv);
    assert.equal(consumption.schedulerDrivenPassiveExecution, false, nodeEnv);
    assert.equal(consumption.publicActPassiveDrain, false, nodeEnv);
    assert.equal(consumption.publicEffectExecution, false, nodeEnv);
    assert.equal(consumption.publicRootExecution, false, nodeEnv);
    assert.equal(consumption.executesPassiveEffects, false, nodeEnv);
    assert.deepEqual(consumption.workerIds, [
      'worker-836-reconciler-private-act-queue-execution-path',
      'worker-837-scheduler-driven-passive-effect-execution'
    ]);

    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      cloneSchedulerDrivenPassiveEffectDiagnostics(passiveDiagnostics),
      'scheduler-driven-passive-diagnostics-passive-ownership',
      `${nodeEnv}:missing-passive-ownership`
    );
    const callerBuiltNestedDiagnostics =
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        expiredReport,
        {
          ...lifecycle.boundaryOptions,
          finishedWorkId: passiveDiagnostics.finishedWorkId,
          diagnosticsOverrides:
            createCallerBuiltSchedulerDrivenPassiveEffectNestedRecords(
              passiveDiagnostics
            )
        }
      );
    assert.equal(
      callerBuiltNestedDiagnostics[
        privateSchedulerDrivenPassiveEffectDiagnosticsBrand
      ],
      true,
      nodeEnv
    );
    assert.equal(Object.isFrozen(callerBuiltNestedDiagnostics), true, nodeEnv);
    assert.equal(
      Object.isFrozen(callerBuiltNestedDiagnostics.schedulerRequest),
      false,
      nodeEnv
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      callerBuiltNestedDiagnostics,
      'scheduler-driven-passive-diagnostics-nested-passive-ownership',
      `${nodeEnv}:caller-built-nested-passive-records`
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        expiredReport,
        {
          ...lifecycle.boundaryOptions,
          diagnosticsOverrides: {
            lifecycleRequestBoundary: {
              ...passiveDiagnostics.lifecycleRequestBoundary
            }
          }
        }
      ),
      'scheduler-driven-passive-diagnostics-lifecycle-boundary-ownership',
      `${nodeEnv}:caller-built-lifecycle-boundary`
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        expiredReport,
        {
          ...lifecycle.boundaryOptions,
          lifecycleRequestId: `${lifecycle.rootId}:foreign-lifecycle-request`
        }
      ),
      'scheduler-driven-passive-diagnostics-lifecycle-boundary-ownership',
      `${nodeEnv}:stale-lifecycle-request-id`
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        expiredReport,
        {
          ...lifecycle.boundaryOptions,
          lifecycleRequestSequence:
            lifecycle.boundary.sourceRequestSequence + 1000
        }
      ),
      'scheduler-driven-passive-diagnostics-lifecycle-boundary-ownership',
      `${nodeEnv}:replayed-lifecycle-request-sequence`
    );
    const crossRootLifecycle =
      createSourceOwnedReactDomLifecycleBoundary(
        `test-utils-passive-cross-root-${nodeEnv}`
      );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        expiredReport,
        {
          ...crossRootLifecycle.boundaryOptions
        }
      ),
      'scheduler-driven-passive-diagnostics-lifecycle-boundary',
      `${nodeEnv}:cross-root-lifecycle-boundary`
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        expiredReport,
        {
          finishedWorkId: passiveDiagnostics.finishedWorkId
        }
      ),
      'scheduler-driven-passive-diagnostics-lifecycle-boundary-ownership',
      `${nodeEnv}:missing-lifecycle-boundary`
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        cloneExpiredActRootWorkReport(expiredReport),
        lifecycle.boundaryOptions
      ),
      'scheduler-driven-passive-diagnostics-scheduler-source-proof',
      `${nodeEnv}:missing-scheduler-source-proof`
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        expiredReport,
        {
          ...lifecycle.boundaryOptions,
          schedulerRequestOverrides: {
            rootId: 857,
            rootLabel: 'foreign-passive-root'
          }
        }
      ),
      'scheduler-driven-passive-diagnostics-scheduler-request',
      `${nodeEnv}:cross-root-scheduler-request`
    );
  }
});

function createSchedulerMockDelayedActRootWorkDiagnostics(
  nodeEnv,
  options = {}
) {
  const { Scheduler, reactGate } =
    loadSchedulerMockAndReactGateForSourceProof(nodeEnv, options);
  const diagnostics =
    Scheduler.unstable_flushExpired[privateActQueueFlushDiagnosticsExport];
  const rootId = options.rootId ?? 835;
  const rootLabel = options.rootLabel ?? 'mock-root-835';

  Scheduler.reset();
  const events = [];
  const createCallback = (label, continuation = null) =>
    reactGate.createInternalActQueueTestCallback(
      (didTimeout) => {
        events.push([
          label,
          didTimeout,
          Scheduler.unstable_getCurrentPriorityLevel(),
          Scheduler.unstable_now()
        ]);
        Scheduler.log(label);
        return continuation;
      },
      { label }
    );
  const delayedContinuation = createCallback(
    'delayed-act-root-continuation'
  );
  const delayedCallback = createCallback(
    'delayed-act-root-callback',
    delayedContinuation
  );
  const delayedHandle = Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_UserBlockingPriority,
    delayedCallback,
    { delay: 10 }
  );
  let publicSchedulerCallbackRan = false;
  Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_NormalPriority,
    () => {
      publicSchedulerCallbackRan = true;
      Scheduler.log('public-scheduler-work');
    }
  );
  const actRootContinuation = createCallback('act-root-continuation');
  const actQueue = reactGate.createInternalActQueueTestQueue([
    reactGate.createInternalActQueueTestTask({
      label: 'act-root-schedule',
      recordKind: 'SchedulerActQueueRequest',
      taskKind: 'RootSchedule',
      continuationStatus: 'NoContinuation',
      callback: createCallback('act-root-schedule')
    }),
    reactGate.createInternalActQueueTestTask({
      label: 'act-root-callback',
      recordKind: 'SyncFlushActContinuationRecord',
      taskKind: 'SchedulerCallback',
      continuationStatus: 'PendingContinuation',
      callback: createCallback('act-root-callback', actRootContinuation)
    })
  ]);
  const metadata = createExpiredActRootWorkMetadata(
    Scheduler,
    delayedHandle,
    actQueue,
    {
      rootId,
      rootLabel,
      rootWorkRecords: acceptedSchedulerMockExpiredActRootWorkRecords.map(
        (recordKind) =>
          createAcceptedExpiredActRootWorkRecord(recordKind, {
            rootId,
            rootLabel
          })
      )
    }
  );
  const delayedMetadata =
    diagnostics.createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics(
      metadata,
      {
        scheduledVirtualTime: 0,
        delayMs: 10,
        startTime: delayedHandle.startTime,
        expirationTime: delayedHandle.expirationTime,
        priorityTimeoutMs:
          delayedHandle.expirationTime - delayedHandle.startTime
      }
    );

  return {
    Scheduler,
    actQueue,
    events,
    getPublicSchedulerCallbackRan() {
      return publicSchedulerCallbackRan;
    },
    reactGate,
    report: Scheduler.unstable_flushExpired(delayedMetadata)
  };
}

function loadSchedulerMockAndReactGateForSourceProof(
  nodeEnv,
  { schedulerFirstCacheHit = false } = {}
) {
  if (schedulerFirstCacheHit) {
    const Scheduler = loadFreshSchedulerMock(nodeEnv);
    const reactGate = loadFreshReactActDispatcherGate();
    return { Scheduler, reactGate };
  }

  const reactGate = loadFreshReactActDispatcherGate();
  const Scheduler = loadFreshSchedulerMock(nodeEnv);
  return { Scheduler, reactGate };
}

function createExpiredActRootWorkMetadata(
  Scheduler,
  callbackHandle,
  actQueue,
  overrides = {}
) {
  const metadata = {
    kind: privateSchedulerMockExpiredActRootWorkMetadataKind,
    version: 1,
    compatibilityTarget: 'scheduler@0.27.0',
    reactCompatibilityTarget: 'react@19.2.6',
    rootId: 835,
    rootLabel: 'mock-root-835',
    lane: 'SyncLane',
    laneLabel: 'SyncLane',
    priorityLevel: Scheduler.unstable_UserBlockingPriority,
    schedulerPriority: 'UserBlocking',
    callbackHandle,
    actQueue,
    expectedActQueuePendingCount: Array.isArray(actQueue?.records)
      ? actQueue.records.length
      : 0,
    rootWorkRecords: [
      createAcceptedExpiredActRootWorkRecord('RootLaneSchedulingSnapshot'),
      createAcceptedExpiredActRootWorkRecord('RootTaskScheduleRecord')
    ],
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
    rendererWorkExecutionBlocked: true,
    rootWorkMetadataOnly: true,
    actQueueHandoffOnly: true,
    ...overrides
  };

  Object.defineProperty(
    metadata,
    privateSchedulerMockExpiredActRootWorkMetadataBrand,
    {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false
    }
  );
  return Object.freeze(metadata);
}

function createAcceptedExpiredActRootWorkRecord(recordKind, overrides = {}) {
  return Object.freeze({
    recordKind,
    accepted: true,
    rootId: 835,
    rootLabel: 'mock-root-835',
    lane: 'SyncLane',
    laneLabel: 'SyncLane',
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
    rendererWorkExecutionBlocked: true,
    rootWorkMetadataOnly: true,
    ...overrides
  });
}

function cloneDelayedActRootWorkReport(report, overrides = {}, options = {}) {
  const cloned = {
    ...report,
    ...overrides
  };

  if (options.withBrand !== false) {
    Object.defineProperty(
      cloned,
      privateSchedulerMockDelayedActRootWorkDiagnosticsBrand,
      {
        configurable: false,
        enumerable: false,
        value: true,
        writable: false
      }
    );
  }

  return Object.freeze(cloned);
}

function cloneExpiredActRootWorkReport(report, overrides = {}) {
  const cloned = {
    ...report,
    ...overrides
  };

  Object.defineProperty(
    cloned,
    privateSchedulerMockExpiredActRootWorkDiagnosticsBrand,
    {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false
    }
  );

  return Object.freeze(cloned);
}

function cloneSchedulerDrivenPassiveEffectDiagnostics(
  diagnostics,
  overrides = {}
) {
  const cloned = {
    ...diagnostics,
    ...overrides
  };

  Object.defineProperty(
    cloned,
    privateSchedulerDrivenPassiveEffectDiagnosticsBrand,
    {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false
    }
  );

  return Object.freeze(cloned);
}

function createCallerBuiltSchedulerDrivenPassiveEffectNestedRecords(
  diagnostics
) {
  const schedulerRequest = { ...diagnostics.schedulerRequest };
  const schedulerGate = {
    ...diagnostics.schedulerGate,
    schedulerRequest
  };
  const passiveEffects = { ...diagnostics.passiveEffects };
  const schedulerExecution = {
    ...diagnostics.schedulerExecution,
    schedulerGate,
    schedulerRequest,
    passiveEffects
  };

  return {
    rootCommitPassiveExecution: {
      ...diagnostics.rootCommitPassiveExecution
    },
    pendingPassiveHandoff: {
      ...diagnostics.pendingPassiveHandoff
    },
    schedulerRequest,
    schedulerGate,
    passiveEffects,
    schedulerExecution
  };
}

function assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
  diagnostics,
  reason,
  label
) {
  assert.equal(
    gateModule.isAcceptedSchedulerDrivenPassiveEffectDiagnostics(diagnostics),
    false,
    label
  );
  assert.throws(
    () => gateModule.consumeSchedulerDrivenPassiveEffectDiagnostics(diagnostics),
    (error) => {
      assert.equal(error.name, 'FastReactDomUnimplementedError', label);
      assert.equal(error.code, 'FAST_REACT_UNIMPLEMENTED', label);
      assert.equal(error.entrypoint, 'react-dom/test-utils', label);
      assert.equal(
        error.exportName,
        `${gateModule.privateTestUtilsActGateExport}.consumeSchedulerDrivenPassiveEffectDiagnostics`,
        label
      );
      assert.equal(error.compatibilityTarget, 'react-dom@19.2.6', label);
      assert.equal(error.reason, reason, label);
      assert.equal(error.publicCompatibilityClaimed, false, label);
      assert.equal(error.publicSchedulerTimingCompatibilityClaimed, false, label);
      assert.equal(error.publicReactActCompatibilityClaimed, false, label);
      assert.equal(error.publicRootSchedulerCompatibilityClaimed, false, label);
      assert.equal(error.publicRendererCompatibilityClaimed, false, label);
      assert.equal(error.drainsPublicSchedulerTaskQueue, false, label);
      assert.equal(error.drainsPublicReactActQueue, false, label);
      assert.equal(error.publicActPassiveDrain, false, label);
      assert.equal(error.publicEffectExecution, false, label);
      assert.equal(error.publicRootExecution, false, label);
      assert.equal(error.executesQueuedWork, false, label);
      assert.equal(error.executesEffects, false, label);
      assert.equal(error.executesPassiveEffects, false, label);
      assert.equal(error.executesRendererWork, false, label);
      assert.equal(error.executesRendererRoots, false, label);
      return true;
    },
    label
  );
}

function assertReactDomDelayedSchedulerDiagnosticsRejected(
  module,
  diagnostics,
  reason,
  label
) {
  assert.equal(
    module.isAcceptedSchedulerMockDelayedActRootWorkDiagnostics(diagnostics),
    false,
    label
  );
  assert.throws(
    () => module.preflightSchedulerMockDelayedActRootWorkDiagnostics(diagnostics),
    (error) => {
      assert.equal(error.name, 'FastReactDomUnimplementedError', label);
      assert.equal(error.code, 'FAST_REACT_UNIMPLEMENTED', label);
      assert.equal(error.entrypoint, 'react-dom/test-utils', label);
      assert.equal(
        error.exportName,
        `${module.privateTestUtilsActGateExport}.preflightSchedulerMockDelayedActRootWorkDiagnostics`,
        label
      );
      assert.equal(error.compatibilityTarget, 'react-dom@19.2.6', label);
      assert.equal(error.reason, reason, label);
      assert.equal(error.publicCompatibilityClaimed, false, label);
      assert.equal(error.publicSchedulerTimingCompatibilityClaimed, false, label);
      assert.equal(error.publicReactActCompatibilityClaimed, false, label);
      assert.equal(error.publicRootSchedulerCompatibilityClaimed, false, label);
      assert.equal(error.publicRendererCompatibilityClaimed, false, label);
      assert.equal(error.drainsPublicSchedulerTaskQueue, false, label);
      assert.equal(error.drainsPublicReactActQueue, false, label);
      assert.equal(error.invokesPublicSchedulerFlushHelper, false, label);
      assert.equal(error.publicSchedulerFlushBehaviorExecuted, false, label);
      assert.equal(
        error.acceptsTopLevelDelayedActRootWorkAsPublicActEvidence,
        false,
        label
      );
      assert.equal(error.executesQueuedWork, false, label);
      assert.equal(error.executesEffects, false, label);
      assert.equal(error.executesPassiveEffects, false, label);
      assert.equal(error.executesRendererWork, false, label);
      assert.equal(error.executesRendererRoots, false, label);
      return true;
    },
    label
  );
}

function loadFreshReactActDispatcherGate() {
  const resolved = require.resolve(reactPrivateActDispatcherGatePath);
  delete require.cache[resolved];
  return require(resolved);
}

function loadFreshSchedulerMock(nodeEnv) {
  const previousNodeEnv = process.env.NODE_ENV;

  for (const filePath of [
    schedulerMockPath,
    schedulerMockCjsDevelopmentPath,
    schedulerMockCjsProductionPath
  ]) {
    const resolved = require.resolve(filePath);
    delete require.cache[resolved];
  }

  process.env.NODE_ENV = nodeEnv;
  try {
    return require(schedulerMockPath);
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

function replacePrerequisite(prerequisites, replacement) {
  return prerequisites.map((prerequisite) =>
    prerequisite.id === replacement.id ? replacement : prerequisite
  );
}

function assertIncludesAll(expectedSubset, actualValues, label) {
  for (const expected of expectedSubset) {
    assert.equal(actualValues.includes(expected), true, `${label}:${expected}`);
  }
}
