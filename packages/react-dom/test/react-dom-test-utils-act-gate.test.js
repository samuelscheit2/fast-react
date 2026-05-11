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
    'passive-effect-root-error-routing-diagnostics'
  ]);
  assert.equal(gate.privatePassiveDiagnostics.publicActPassiveDrain, false);
  assert.equal(gate.privatePassiveDiagnostics.publicEffectExecution, false);
  assert.equal(
    gate.privatePassiveDiagnostics.schedulerDrivenPassiveExecution,
    false
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
      label: 'tampered-public-claims',
      prerequisite: {
        ...baseline,
        publicCompatibilityClaimed: true,
        publicTestUtilsActReady: true,
        publicSchedulerTimingReady: true,
        publicSchedulerFlushBehaviorExecuted: true,
        publicRootExecution: true,
        publicEffectExecution: true,
        executesRendererRoots: true,
        publicBlockerClaims: {
          ...baseline.publicBlockerClaims,
          publicTestUtilsActReady: true,
          publicSchedulerFlushBehaviorExecuted: true,
          publicRootExecution: true,
          publicEffectExecution: true,
          executesRendererRoots: true
        }
      },
      staleReasons: [
        'publicCompatibilityClaimed-not-false',
        'publicTestUtilsActReady-not-false',
        'publicSchedulerTimingReady-not-false',
        'publicSchedulerFlushBehaviorExecuted-not-false',
        'publicRootExecution-not-false',
        'publicEffectExecution-not-false',
        'executesRendererRoots-not-false',
        'publicBlockerClaims.publicTestUtilsActReady-not-false',
        'publicBlockerClaims.publicSchedulerFlushBehaviorExecuted-not-false',
        'publicBlockerClaims.publicRootExecution-not-false',
        'publicBlockerClaims.publicEffectExecution-not-false',
        'publicBlockerClaims.executesRendererRoots-not-false'
      ],
      publicClaimFields: [
        'publicCompatibilityClaimed',
        'publicTestUtilsActReady',
        'publicSchedulerTimingReady',
        'publicSchedulerFlushBehaviorExecuted',
        'publicRootExecution',
        'publicEffectExecution',
        'executesRendererRoots',
        'publicBlockerClaims.publicTestUtilsActReady',
        'publicBlockerClaims.publicSchedulerFlushBehaviorExecuted',
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
