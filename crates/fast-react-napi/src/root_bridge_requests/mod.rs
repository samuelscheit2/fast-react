//! Private native root request records.
//!
//! The records in this module are inert diagnostics for the future native
//! bridge. They only retain handle-table metadata and do not store raw
//! JavaScript values, invoke the reconciler, or perform host work.

use std::collections::HashSet;
use std::error::Error;
use std::fmt::{self, Display, Formatter};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, OnceLock};

use serde_json::{Map, Value};

use crate::handle_table::{
    BridgeEnvironmentId, BridgeEnvironmentTeardown, BridgeHandle, BridgeHandleAdmissionOutcome,
    BridgeHandleKind, BridgeHandleTable, BridgeHandleTableError,
    BridgeHandleTableTeardownIsolationDiagnostics, PlaceholderRootRecord, PlaceholderValueRecord,
    bridge_handle_table_cross_environment_teardown_diagnostics,
};

pub(crate) const NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_EXECUTABLE_PREFLIGHT_STATUS: &str =
    "preflighted-native-root-bridge-worker-thread-teardown-boundary";
pub(crate) const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_STATUS: &str =
    "preflighted-native-root-bridge-worker-thread-cleanup-hook-order";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_PREFLIGHT_MODEL: &str =
    "fast-react-napi.WorkerThreadTeardownPreflight";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_TEARDOWN_PREFLIGHT_EXECUTION_SCOPE: &str =
    "rust-only-handle-table-preflight-no-node-worker-thread-no-napi-cleanup-hook";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_MODEL: &str =
    "fast-react-napi.WorkerThreadCleanupHookOrderPreflight";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PREFLIGHT_EXECUTION_SCOPE: &str =
    "rust-only-cleanup-hook-order-preflight-no-node-worker-thread-no-napi-cleanup-hook-execution";
pub(crate) const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_STALE_EVIDENCE_CODE: &str =
    "FAST_REACT_NAPI_CLEANUP_HOOK_STALE_EXECUTABLE_PREFLIGHT";
pub(crate) const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_FORGED_EVIDENCE_CODE: &str =
    "FAST_REACT_NAPI_CLEANUP_HOOK_FORGED_EVIDENCE";
pub(crate) const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ORDER_MISMATCH_CODE: &str =
    "FAST_REACT_NAPI_CLEANUP_HOOK_ORDER_MISMATCH";
pub(crate) const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_IDENTITY_MISMATCH_CODE: &str =
    "FAST_REACT_NAPI_CLEANUP_HOOK_IDENTITY_MISMATCH";
pub(crate) const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_PUBLIC_NATIVE_PACKAGE_CLAIM_CODE:
    &str = "FAST_REACT_NAPI_CLEANUP_HOOK_PUBLIC_NATIVE_PACKAGE_CLAIM";
pub(crate) const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_CANONICAL_SET_MISMATCH_CODE: &str =
    "FAST_REACT_NAPI_CLEANUP_HOOK_CANONICAL_SET_MISMATCH";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_SOURCE_ROW_ID: &str =
    "worker-render-root-stale-executable-preflight";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_SOURCE_ROW_ID: &str =
    "worker-render-value-stale-executable-preflight";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_SOURCE_PROVENANCE_TOKEN: &str =
    "cleanup-hook-source-provenance:worker-764:env-764:render-root:slot-1:g1-current-2";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_SOURCE_PROVENANCE_TOKEN: &str =
    "cleanup-hook-source-provenance:worker-764:env-764:render-value:slot-3:g1-current-2";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ID: &str =
    "worker-root-handle-cleanup-hook";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ID: &str =
    "worker-value-handle-cleanup-hook";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_EVIDENCE_ROW_ID: &str =
    "cleanup-hook-worker-root-before-value-release";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_EVIDENCE_ROW_ID: &str =
    "cleanup-hook-worker-value-after-root-release";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_FUNCTION_IDENTITY_TOKEN: &str =
    "private-cleanup-hook-fn:worker-root-handle-teardown";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_FUNCTION_IDENTITY_TOKEN: &str =
    "private-cleanup-hook-fn:worker-value-handle-teardown";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ARGUMENT_IDENTITY_TOKEN: &str =
    "private-cleanup-hook-arg:worker-764-root-slot-1";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ARGUMENT_IDENTITY_TOKEN: &str =
    "private-cleanup-hook-arg:worker-764-value-slot-3";
const NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_COUNT: u8 = 2;
pub(crate) const NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_STATUS: &str =
    "consumed-native-root-bridge-batch-lifecycle-records";
const NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_MODEL: &str =
    "fast-react-napi.NativeRootBridgeBatchLifecycleConsumer";
pub(crate) const NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_LINK_STATUS:
    &str = "linked-native-root-bridge-batch-lifecycle-consumer-json-batch-roundtrip";
const NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_LINK_MODEL: &str =
    "fast-react-napi.NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink";
pub(crate) const NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STATUS: &str =
    "executed-native-root-bridge-json-batch-lifecycle-state-machine";
const NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_MODEL: &str =
    "fast-react-napi.NativeRootBridgeJsonBatchLifecycleExecutor";
pub(crate) const NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STALE_OR_FOREIGN_ROW_CODE: &str =
    "FAST_REACT_NAPI_JSON_BATCH_LIFECYCLE_EXECUTOR_STALE_OR_FOREIGN_ROW";
pub(crate) const NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_CALLER_BUILT_ROW_CODE: &str =
    "FAST_REACT_NAPI_JSON_BATCH_LIFECYCLE_EXECUTOR_CALLER_BUILT_ROW";
pub(crate) const NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE: &str =
        "FAST_REACT_NAPI_JSON_BATCH_LIFECYCLE_EXECUTOR_PUBLIC_NATIVE_EXECUTION_CLAIM";
static NEXT_NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_GENERATION: AtomicU64 =
    AtomicU64::new(1);
static CONSUMED_NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_GENERATIONS: OnceLock<
    Mutex<HashSet<u64>>,
> = OnceLock::new();
pub(crate) const NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_CLEANUP_STATUS_MISMATCH_CODE: &str =
        "FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_CLEANUP_STATUS_MISMATCH";
pub(crate) const NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_ROW_ID_MISMATCH_CODE: &str =
        "FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_ROW_ID_MISMATCH";
pub(crate) const NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_KIND_TRANSITION_MISMATCH_CODE: &str =
        "FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_KIND_TRANSITION_MISMATCH";
pub(crate) const NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE: &str =
        "FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_PUBLIC_NATIVE_EXECUTION_CLAIM";
pub(crate) const NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_ROW_ORDER_MISMATCH_CODE: &str =
        "FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_ROW_ORDER_MISMATCH";
pub(crate) const NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_STALE_OR_FOREIGN_JSON_BATCH_ROW_CODE: &str =
        "FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_STALE_OR_FOREIGN_JSON_BATCH_ROW";
const NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_VALIDATE_NAME: &str =
    "validateNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRows";
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STATUS: &str =
    "consumed-native-root-bridge-cleanup-generation-evidence";
const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_MODEL: &str =
    "fast-react-napi.NativeRootBridgeCleanupGenerationConsumer";
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_STALE_OR_FOREIGN_EVIDENCE_CODE:
    &str = "FAST_REACT_NAPI_CLEANUP_GENERATION_STALE_OR_FOREIGN_EVIDENCE";
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_REPLAYED_EVIDENCE_CODE: &str =
    "FAST_REACT_NAPI_CLEANUP_GENERATION_REPLAYED_EVIDENCE";
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CONSUMER_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE: &str =
        "FAST_REACT_NAPI_CLEANUP_GENERATION_PUBLIC_NATIVE_EXECUTION_CLAIM";
#[cfg(test)]
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CANARY_STATUS: &str =
    "accepted-native-root-bridge-cleanup-generation-currentness-canary";
#[cfg(test)]
const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CANARY_MODEL: &str =
    "fast-react-napi.NativeRootBridgeCleanupGenerationCurrentnessCanary";
#[cfg(test)]
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_GENERATION_CODE: &str =
    "FAST_REACT_NAPI_CLEANUP_GENERATION_CURRENTNESS_STALE_GENERATION";
#[cfg(test)]
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_FORGED_CLEANUP_ROW_CODE: &str =
    "FAST_REACT_NAPI_CLEANUP_GENERATION_CURRENTNESS_FORGED_CLEANUP_ROW";
#[cfg(test)]
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CROSS_WORKER_THREAD_CODE: &str =
    "FAST_REACT_NAPI_CLEANUP_GENERATION_CURRENTNESS_CROSS_WORKER_THREAD_HANDOFF";
#[cfg(test)]
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN_CODE: &str =
    "FAST_REACT_NAPI_CLEANUP_GENERATION_CURRENTNESS_STALE_OR_FOREIGN";
#[cfg(test)]
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REPLAYED_OR_RETIRED_CODE: &str =
    "FAST_REACT_NAPI_CLEANUP_GENERATION_CURRENTNESS_REPLAYED_OR_RETIRED";
#[cfg(test)]
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_DUPLICATE_CLEANUP_CODE: &str =
    "FAST_REACT_NAPI_CLEANUP_GENERATION_CURRENTNESS_DUPLICATE_CLEANUP";
#[cfg(test)]
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_AFTER_RETIRE_CODE: &str =
    "FAST_REACT_NAPI_CLEANUP_GENERATION_CURRENTNESS_REENTRY_AFTER_RETIRE";
#[cfg(test)]
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_GUARD_CONSUMED_STATUS:
    &str = "cleanup-generation-currentness-reentry-guard-consumed";
#[cfg(test)]
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_MISSING_CLEANUP_HOOK_IDENTITY_CODE:
        &str = "FAST_REACT_NAPI_CLEANUP_GENERATION_CURRENTNESS_MISSING_CLEANUP_HOOK_IDENTITY";
#[cfg(test)]
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_CALLER_BUILT_METADATA_CODE:
    &str = "FAST_REACT_NAPI_CLEANUP_GENERATION_CURRENTNESS_CALLER_BUILT_METADATA";
#[cfg(test)]
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE:
        &str = "FAST_REACT_NAPI_CLEANUP_GENERATION_CURRENTNESS_PUBLIC_NATIVE_EXECUTION_CLAIM";
#[cfg(test)]
pub(crate) const NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_EVIDENCE_IDS: &[&str] =
    &[
        NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_GUARD_CONSUMED_STATUS,
        "cleanup-generation-currentness-duplicate-cleanup-rejected",
        "cleanup-generation-currentness-source-record-id-smuggling-rejected",
        "cleanup-generation-currentness-source-provenance-smuggling-rejected",
        "cleanup-generation-currentness-stale-generation-reentry-rejected",
        "cleanup-generation-currentness-cross-environment-reentry-rejected",
        "cleanup-generation-currentness-reentry-after-retire-rejected",
        "cleanup-generation-currentness-caller-built-reentry-rejected",
        "cleanup-generation-currentness-missing-source-identity-rejected",
        "cleanup-generation-currentness-public-native-package-claim-rejected",
    ];
const NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_LINKED_STATUS: &str =
    "linked";
const NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_REJECTED_STATUS: &str =
    "rejected";
const NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_ROW_STATUSES: &[&str] = &[
    NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_LINKED_STATUS,
    NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_REJECTED_STATUS,
];
const NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_JSON_BATCH_ROUNDTRIP_REJECTION_CASE_IDS:
    &[&str] = &[
    "consumer-row-id-mismatch",
    "consumer-row-order-mismatch",
    "consumer-kind-transition-mismatch",
    "consumer-cleanup-status-mismatch",
    "stale-or-foreign-json-batch-row",
    "public-native-execution-claim",
];
const NATIVE_ROOT_BRIDGE_BATCH_LIFECYCLE_CONSUMER_CLEANUP_HOOK_NOT_REQUIRED_STATUS: &str =
    "not-required";
static CONSUMED_NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_EVIDENCE: OnceLock<
    Mutex<HashSet<NativeRootBridgeCleanupGenerationConsumptionKey>>,
> = OnceLock::new();
#[cfg(test)]
static CONSUMED_NATIVE_ROOT_BRIDGE_CLEANUP_GENERATION_CURRENTNESS_REENTRY_GUARDS: OnceLock<
    Mutex<HashSet<NativeRootBridgeCleanupGenerationCurrentnessReentryGuardKey>>,
> = OnceLock::new();

include!("request_records.rs");
include!("json_transport.rs");
include!("worker_teardown.rs");
include!("cleanup_generation.rs");
include!("batch_lifecycle.rs");
include!("worker_teardown_rows.rs");
include!("errors.rs");
include!("request_state.rs");
include!("batch_lifecycle_algorithms.rs");
include!("cleanup_generation_algorithms.rs");
include!("worker_teardown_algorithms.rs");
include!("json_transport_parser.rs");
include!("tests.rs");
