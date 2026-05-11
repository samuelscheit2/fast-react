use super::*;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateUpdateRouteError {
    RootNotActive {
        lifecycle: TestRendererRootLifecycle,
    },
    MissingScheduledUpdate,
    UnexpectedScheduledUpdateKind {
        actual: TestRendererRootUpdateKind,
    },
    IncompatibleFinishedWork {
        reason: &'static str,
    },
    MissingHostTextUpdateApply,
}

impl Display for TestRendererPrivateUpdateRouteError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::RootNotActive { lifecycle } => write!(
                formatter,
                "private update route requires an active root, found {lifecycle:?}"
            ),
            Self::MissingScheduledUpdate => {
                formatter.write_str("private update route found no scheduled HostRoot update")
            }
            Self::UnexpectedScheduledUpdateKind { actual } => write!(
                formatter,
                "private update route expected a scheduled update, found {actual:?}"
            ),
            Self::IncompatibleFinishedWork { reason } => write!(
                formatter,
                "private update route finished-work record is incompatible: {reason}"
            ),
            Self::MissingHostTextUpdateApply => formatter.write_str(
                "private update route expected one accepted HostText update apply record",
            ),
        }
    }
}

impl Error for TestRendererPrivateUpdateRouteError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateUpdateNativeBridgeAdmissionError {
    MissingHostOutputHandoff,
    UnexpectedRouteOutcome { actual: &'static str },
    UnexpectedScheduledUpdateKind { actual: TestRendererRootUpdateKind },
    StaleRouteOutcome,
}

impl Display for TestRendererPrivateUpdateNativeBridgeAdmissionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingHostOutputHandoff => formatter.write_str(
                "private update native bridge admission requires update host-output handoff evidence",
            ),
            Self::UnexpectedRouteOutcome { actual } => write!(
                formatter,
                "private update native bridge admission expected a scheduled update route outcome, found {actual}",
            ),
            Self::UnexpectedScheduledUpdateKind { actual } => write!(
                formatter,
                "private update native bridge admission expected a scheduled update, found {actual:?}",
            ),
            Self::StaleRouteOutcome => formatter.write_str(
                "private update native bridge admission route outcome is not the latest scheduled update",
            ),
        }
    }
}

impl Error for TestRendererPrivateUpdateNativeBridgeAdmissionError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateErrorBoundaryNativeExecutionError {
    RootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    RecordMismatch {
        reason: &'static str,
    },
    PublicRecoveryOpened {
        reason: &'static str,
    },
}

impl Display for TestRendererPrivateErrorBoundaryNativeExecutionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::RootMismatch { expected, actual } => write!(
                formatter,
                "private error boundary native execution evidence expected root {expected:?}, found {actual:?}",
            ),
            Self::RecordMismatch { reason } => write!(
                formatter,
                "private error boundary native execution evidence rejected update execution record: {reason}",
            ),
            Self::PublicRecoveryOpened { reason } => write!(
                formatter,
                "private error boundary native execution evidence cannot open public recovery: {reason}",
            ),
        }
    }
}

impl Error for TestRendererPrivateErrorBoundaryNativeExecutionError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateActNestedScopePassiveFlushError {
    RootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    RecordMismatch {
        reason: &'static str,
    },
    PublicActOpened {
        reason: &'static str,
    },
}

impl Display for TestRendererPrivateActNestedScopePassiveFlushError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::RootMismatch { expected, actual } => write!(
                formatter,
                "private nested act passive flush expected root {expected:?}, found {actual:?}",
            ),
            Self::RecordMismatch { reason } => write!(
                formatter,
                "private nested act passive flush rejected passive metadata: {reason}",
            ),
            Self::PublicActOpened { reason } => write!(
                formatter,
                "private nested act passive flush cannot open public act behavior: {reason}",
            ),
        }
    }
}

impl Error for TestRendererPrivateActNestedScopePassiveFlushError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateUnmountNativeBridgeAdmissionError {
    AlreadyUnmountedRoot,
    MissingDeletionCommitHandoff,
    UnexpectedRouteOutcome { actual: &'static str },
    UnexpectedScheduledUpdateKind { actual: TestRendererRootUpdateKind },
    StaleRouteOutcome,
    StaleDeletionCommitHandoff { reason: &'static str },
    MissingCleanupBlockers { reason: &'static str },
}

impl Display for TestRendererPrivateUnmountNativeBridgeAdmissionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::AlreadyUnmountedRoot => formatter.write_str(
                "private unmount native bridge admission rejects already-unmounted roots",
            ),
            Self::MissingDeletionCommitHandoff => formatter.write_str(
                "private unmount native bridge admission requires deletion commit handoff evidence",
            ),
            Self::UnexpectedRouteOutcome { actual } => write!(
                formatter,
                "private unmount native bridge admission expected a scheduled unmount route outcome, found {actual}",
            ),
            Self::UnexpectedScheduledUpdateKind { actual } => write!(
                formatter,
                "private unmount native bridge admission expected a scheduled unmount update, found {actual:?}",
            ),
            Self::StaleRouteOutcome => formatter.write_str(
                "private unmount native bridge admission route outcome is not the latest scheduled update",
            ),
            Self::StaleDeletionCommitHandoff { reason } => write!(
                formatter,
                "private unmount native bridge admission deletion handoff is stale: {reason}",
            ),
            Self::MissingCleanupBlockers { reason } => write!(
                formatter,
                "private unmount native bridge admission cleanup blockers are missing: {reason}",
            ),
        }
    }
}

impl Error for TestRendererPrivateUnmountNativeBridgeAdmissionError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateTestInstanceNativeQueryExecutionError {
    NativeExecutionRecordMismatch {
        operation: &'static str,
        reason: &'static str,
    },
}

impl Display for TestRendererPrivateTestInstanceNativeQueryExecutionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::NativeExecutionRecordMismatch { operation, reason } => write!(
                formatter,
                "private TestInstance native query execution evidence rejected {operation} execution record: {reason}",
            ),
        }
    }
}

impl Error for TestRendererPrivateTestInstanceNativeQueryExecutionError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateRootLifecycleExecutionError {
    LifecycleExecutionRecordMismatch {
        operation: &'static str,
        reason: &'static str,
    },
}

impl Display for TestRendererPrivateRootLifecycleExecutionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::LifecycleExecutionRecordMismatch { operation, reason } => write!(
                formatter,
                "private root lifecycle execution evidence rejected {operation} execution record: {reason}",
            ),
        }
    }
}

impl Error for TestRendererPrivateRootLifecycleExecutionError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererSerializationGateError {
    CommitRootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    CommitIsNotCurrent {
        root: FiberRootId,
        expected_current: TestRendererFiberHandleDiagnostics,
        actual_current: TestRendererFiberHandleDiagnostics,
    },
    Closed(TestRendererSerializationGateReport),
}

impl TestRendererSerializationGateError {
    #[must_use]
    pub const fn report(&self) -> Option<&TestRendererSerializationGateReport> {
        match self {
            Self::Closed(report) => Some(report),
            Self::CommitRootMismatch { .. } | Self::CommitIsNotCurrent { .. } => None,
        }
    }
}

impl Display for TestRendererSerializationGateError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::CommitRootMismatch { expected, actual } => write!(
                formatter,
                "serialization gate commit root {} does not match test renderer root {}",
                actual.raw(),
                expected.raw()
            ),
            Self::CommitIsNotCurrent {
                root,
                expected_current,
                actual_current,
            } => write!(
                formatter,
                "serialization gate commit fiber slot {} is not current for root {}; current slot is {}",
                expected_current.slot(),
                root.raw(),
                actual_current.slot()
            ),
            Self::Closed(report) => write!(
                formatter,
                "serialization gate '{}' is closed for root {} with status {:?}",
                report.gate_name(),
                report.commit().root().raw(),
                report.status()
            ),
        }
    }
}

impl Error for TestRendererSerializationGateError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateJsonSerializationError {
    HostOutputSnapshotStale,
    CommittedFiberInspectionMissing,
    CommittedFiberInspectionStale,
    CommittedFiberMismatch {
        node_kind: TestRendererPrivateJsonNodeKind,
    },
    CanaryFixtureRawMismatch {
        node_kind: TestRendererPrivateJsonNodeKind,
        field: &'static str,
        expected: u64,
        actual: u64,
    },
    RootChildCount {
        actual: usize,
    },
    RootChildIsText,
    HostComponentChildCount {
        element_type: TestElementType,
        actual: usize,
    },
    HostComponentChildIsElement {
        element_type: TestElementType,
    },
    HostOutputRowMismatch {
        row_id: &'static str,
        expected: TestRendererRootUpdateKind,
        actual: TestRendererRootUpdateKind,
    },
    HostOutputRowShapeMismatch {
        row_id: &'static str,
        expected: TestRendererPrivateToJsonHostOutputShape,
        actual: TestRendererPrivateToJsonHostOutputShape,
    },
    NativeExecutionRecordMismatch {
        operation: &'static str,
        reason: &'static str,
    },
    TreeNativeExecutionRecordMismatch {
        operation: &'static str,
        reason: &'static str,
    },
    UnmountSnapshotNotEmpty {
        actual: usize,
    },
}

impl Display for TestRendererPrivateJsonSerializationError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::HostOutputSnapshotStale => formatter.write_str(
                "private JSON serialization canary snapshot is not the current host output",
            ),
            Self::CommittedFiberInspectionMissing => formatter
                .write_str("private JSON serialization canary has no committed fiber inspection"),
            Self::CommittedFiberInspectionStale => formatter.write_str(
                "private JSON serialization canary committed fiber inspection is not current",
            ),
            Self::CommittedFiberMismatch { node_kind } => write!(
                formatter,
                "private JSON serialization canary committed {:?} fiber does not match the host-output canary",
                node_kind
            ),
            Self::CanaryFixtureRawMismatch {
                node_kind,
                field,
                expected,
                actual,
            } => write!(
                formatter,
                "private JSON serialization canary committed {:?} fiber {field} raw handle {actual} does not match fixture raw handle {expected}",
                node_kind
            ),
            Self::RootChildCount { actual } => write!(
                formatter,
                "private JSON serialization canary expected exactly one root child, found {actual}",
            ),
            Self::RootChildIsText => formatter.write_str(
                "private JSON serialization canary expected a root host component, found text",
            ),
            Self::HostComponentChildCount {
                element_type,
                actual,
            } => write!(
                formatter,
                "private JSON serialization canary expected host component '{}' to have exactly one text child, found {actual}",
                element_type.as_str()
            ),
            Self::HostComponentChildIsElement { element_type } => write!(
                formatter,
                "private JSON serialization canary expected host component '{}' child to be text, found host component",
                element_type.as_str()
            ),
            Self::HostOutputRowMismatch {
                row_id,
                expected,
                actual,
            } => write!(
                formatter,
                "private JSON serialization canary row '{row_id}' expected {:?} host output, found {:?}",
                expected, actual
            ),
            Self::HostOutputRowShapeMismatch {
                row_id,
                expected,
                actual,
            } => write!(
                formatter,
                "private JSON serialization canary row '{row_id}' expected {} host output shape, found {}",
                expected.as_str(),
                actual.as_str()
            ),
            Self::NativeExecutionRecordMismatch { operation, reason } => write!(
                formatter,
                "private toJSON native execution evidence rejected {operation} execution record: {reason}",
            ),
            Self::TreeNativeExecutionRecordMismatch { operation, reason } => write!(
                formatter,
                "private toTree native execution evidence rejected {operation} execution record: {reason}",
            ),
            Self::UnmountSnapshotNotEmpty { actual } => write!(
                formatter,
                "private JSON serialization canary expected unmount host output to be empty, found {actual} root child nodes",
            ),
        }
    }
}

impl Error for TestRendererPrivateJsonSerializationError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateSerializationFinishedWorkIdentityError {
    MissingSerializationEvidence {
        public_surface: &'static str,
    },
    MissingFinishedWorkHandoff {
        public_surface: &'static str,
    },
    MissingCommittedHostRoot {
        public_surface: &'static str,
    },
    ForeignFinishedWorkIdentity {
        reason: &'static str,
    },
    StaleFinishedWorkIdentity {
        reason: &'static str,
    },
    NonCommittedFinishedWorkIdentity {
        reason: &'static str,
    },
    LaneMismatch {
        render_lanes_bits: u32,
        commit_finished_lanes_bits: u32,
    },
    SerializationEvidenceMismatch {
        reason: &'static str,
    },
    PublicCompatibilityOpened {
        reason: &'static str,
    },
}

impl Display for TestRendererPrivateSerializationFinishedWorkIdentityError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingSerializationEvidence { public_surface } => write!(
                formatter,
                "private {public_surface} finished-work identity gate requires serialization evidence",
            ),
            Self::MissingFinishedWorkHandoff { public_surface } => write!(
                formatter,
                "private {public_surface} finished-work identity gate requires HostRoot render finished-work evidence",
            ),
            Self::MissingCommittedHostRoot { public_surface } => write!(
                formatter,
                "private {public_surface} finished-work identity gate requires committed HostRoot evidence",
            ),
            Self::ForeignFinishedWorkIdentity { reason } => write!(
                formatter,
                "private serialization finished-work identity gate rejected foreign evidence: {reason}",
            ),
            Self::StaleFinishedWorkIdentity { reason } => write!(
                formatter,
                "private serialization finished-work identity gate rejected stale evidence: {reason}",
            ),
            Self::NonCommittedFinishedWorkIdentity { reason } => write!(
                formatter,
                "private serialization finished-work identity gate rejected non-committed finished-work evidence: {reason}",
            ),
            Self::LaneMismatch {
                render_lanes_bits,
                commit_finished_lanes_bits,
            } => write!(
                formatter,
                "private serialization finished-work identity gate expected render lanes {render_lanes_bits}, found committed finished lanes {commit_finished_lanes_bits}",
            ),
            Self::SerializationEvidenceMismatch { reason } => write!(
                formatter,
                "private serialization finished-work identity gate rejected serialization evidence: {reason}",
            ),
            Self::PublicCompatibilityOpened { reason } => write!(
                formatter,
                "private serialization finished-work identity gate cannot open public compatibility: {reason}",
            ),
        }
    }
}

impl Error for TestRendererPrivateSerializationFinishedWorkIdentityError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererStableSiblingInsertionCanaryError {
    MissingPlacementRecord,
    MultiplePlacementRecords { actual: usize },
    UnexpectedInsertedFiber,
    UnexpectedStableSibling,
}

impl Display for TestRendererStableSiblingInsertionCanaryError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingPlacementRecord => formatter.write_str(
                "stable-sibling insertion canary found no HostRoot placement apply record",
            ),
            Self::MultiplePlacementRecords { actual } => write!(
                formatter,
                "stable-sibling insertion canary expected one HostRoot placement apply record, found {actual}",
            ),
            Self::UnexpectedInsertedFiber => formatter.write_str(
                "stable-sibling insertion canary placement record does not target the inserted fiber",
            ),
            Self::UnexpectedStableSibling => formatter.write_str(
                "stable-sibling insertion canary placement record does not target the stable sibling",
            ),
        }
    }
}

impl Error for TestRendererStableSiblingInsertionCanaryError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererRootCreatePreflightError {
    UnsupportedChildren {
        child_shape: TestRendererRootCreatePreflightChildShape,
    },
    StaleCanaryMetadata {
        expected_metadata_id: &'static str,
        actual_metadata_id: &'static str,
        expected_root_api: &'static str,
        actual_root_api: &'static str,
    },
    MissingRootOptions,
    MissingWorkLoopFinishedWorkPreflightMetadata,
    StaleWorkLoopFinishedWorkPreflightMetadata {
        expected_metadata_id: &'static str,
        actual_metadata_id: &'static str,
        expected_render_phase_api: &'static str,
        actual_render_phase_api: &'static str,
    },
}

impl Display for TestRendererRootCreatePreflightError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnsupportedChildren { child_shape } => write!(
                formatter,
                "private root-create preflight only accepts a HostComponent with one text child, found {} children",
                child_shape.code()
            ),
            Self::StaleCanaryMetadata {
                expected_metadata_id,
                actual_metadata_id,
                expected_root_api,
                actual_root_api,
            } => write!(
                formatter,
                "private root-create preflight canary metadata is stale: expected {expected_metadata_id}/{expected_root_api}, found {actual_metadata_id}/{actual_root_api}",
            ),
            Self::MissingRootOptions => formatter.write_str(
                "private root-create preflight requires explicit TestRendererOptions metadata",
            ),
            Self::MissingWorkLoopFinishedWorkPreflightMetadata => formatter.write_str(
                "private root-create preflight requires accepted root work-loop finished-work preflight metadata",
            ),
            Self::StaleWorkLoopFinishedWorkPreflightMetadata {
                expected_metadata_id,
                actual_metadata_id,
                expected_render_phase_api,
                actual_render_phase_api,
            } => write!(
                formatter,
                "private root-create preflight root work-loop finished-work metadata is stale: expected {expected_metadata_id}/{expected_render_phase_api}, found {actual_metadata_id}/{actual_render_phase_api}",
            ),
        }
    }
}

impl Error for TestRendererRootCreatePreflightError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererPrivateCreateRouteAdmissionError {
    MissingRustAdmissionRecord,
    StaleRustAdmissionRecord {
        expected_metadata_id: &'static str,
        actual_metadata_id: &'static str,
        expected_root_api: &'static str,
        actual_root_api: &'static str,
    },
    MissingRootCreatePreflight,
    StaleRootCreatePreflight {
        expected_diagnostic_name: &'static str,
        actual_diagnostic_name: &'static str,
        expected_status: &'static str,
        actual_status: &'static str,
    },
    StaleWorkLoopFinishedWorkPreflight {
        expected_metadata_id: &'static str,
        actual_metadata_id: &'static str,
        expected_render_phase_api: &'static str,
        actual_render_phase_api: &'static str,
    },
    StaleCreateHostOutputHandoff {
        reason: &'static str,
    },
    UnexpectedCreateHostOutputShape {
        expected: TestRendererPrivateToJsonHostOutputShape,
        actual: TestRendererPrivateToJsonHostOutputShape,
    },
}

impl Display for TestRendererPrivateCreateRouteAdmissionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingRustAdmissionRecord => formatter.write_str(
                "private create-route admission requires an accepted Rust admission record",
            ),
            Self::StaleRustAdmissionRecord {
                expected_metadata_id,
                actual_metadata_id,
                expected_root_api,
                actual_root_api,
            } => write!(
                formatter,
                "private create-route admission Rust record is stale: expected {expected_metadata_id}/{expected_root_api}, found {actual_metadata_id}/{actual_root_api}",
            ),
            Self::MissingRootCreatePreflight => formatter.write_str(
                "private create-route admission requires accepted root-create preflight diagnostics",
            ),
            Self::StaleRootCreatePreflight {
                expected_diagnostic_name,
                actual_diagnostic_name,
                expected_status,
                actual_status,
            } => write!(
                formatter,
                "private create-route admission root-create preflight is stale: expected {expected_diagnostic_name}/{expected_status}, found {actual_diagnostic_name}/{actual_status}",
            ),
            Self::StaleWorkLoopFinishedWorkPreflight {
                expected_metadata_id,
                actual_metadata_id,
                expected_render_phase_api,
                actual_render_phase_api,
            } => write!(
                formatter,
                "private create-route admission work-loop finished-work preflight is stale: expected {expected_metadata_id}/{expected_render_phase_api}, found {actual_metadata_id}/{actual_render_phase_api}",
            ),
            Self::StaleCreateHostOutputHandoff { reason } => write!(
                formatter,
                "private create-route admission host-output handoff is stale: {reason}",
            ),
            Self::UnexpectedCreateHostOutputShape { expected, actual } => write!(
                formatter,
                "private create-route admission expected host-output shape {}, found {}",
                expected.as_str(),
                actual.as_str()
            ),
        }
    }
}

impl Error for TestRendererPrivateCreateRouteAdmissionError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererRootError {
    Host(HostError),
    FiberRootStore(FiberRootStoreError),
    RootUpdate(RootUpdateError),
    RootScheduler(RootSchedulerError),
    RootWorkLoop(RootWorkLoopError),
    RootCommit(RootCommitError),
    SerializationGate(Box<TestRendererSerializationGateError>),
    PrivateUpdateRoute(Box<TestRendererPrivateUpdateRouteError>),
    PrivateUpdateNativeBridgeAdmission(Box<TestRendererPrivateUpdateNativeBridgeAdmissionError>),
    PrivateErrorBoundaryNativeExecution(Box<TestRendererPrivateErrorBoundaryNativeExecutionError>),
    PrivateActNestedScopePassiveFlush(Box<TestRendererPrivateActNestedScopePassiveFlushError>),
    PrivateUnmountNativeBridgeAdmission(Box<TestRendererPrivateUnmountNativeBridgeAdmissionError>),
    PrivateTestInstanceNativeQueryExecution(
        Box<TestRendererPrivateTestInstanceNativeQueryExecutionError>,
    ),
    PrivateRootLifecycleExecution(Box<TestRendererPrivateRootLifecycleExecutionError>),
    PrivateJsonSerialization(Box<TestRendererPrivateJsonSerializationError>),
    PrivateSerializationFinishedWorkIdentity(
        Box<TestRendererPrivateSerializationFinishedWorkIdentityError>,
    ),
    StableSiblingInsertionCanary(Box<TestRendererStableSiblingInsertionCanaryError>),
    RootCreatePreflight(Box<TestRendererRootCreatePreflightError>),
    PrivateCreateRouteAdmission(Box<TestRendererPrivateCreateRouteAdmissionError>),
    HostOutputCanary(TestRendererHostOutputCanaryError),
    FiberInspection(TestRendererCommittedFiberInspectionError),
    MissingHostOutputFixture {
        element: RootElementHandle,
    },
    MissingCommittedHostOutput {
        operation: TestRendererRootUpdateKind,
    },
    MissingHostParentPlacementApply {
        parent_state_node_raw: u64,
        child_state_node_raw: u64,
    },
    MissingHostTextUpdateApply {
        current_text_slot: usize,
        updated_text_slot: usize,
        text_state_node_raw: u64,
    },
    UnexpectedHostOutputUpdateKind {
        expected: TestRendererRootUpdateKind,
        actual: TestRendererRootUpdateKind,
    },
}

impl Display for TestRendererRootError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Host(error) => Display::fmt(error, formatter),
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::RootUpdate(error) => Display::fmt(error, formatter),
            Self::RootScheduler(error) => Display::fmt(error, formatter),
            Self::RootWorkLoop(error) => Display::fmt(error, formatter),
            Self::RootCommit(error) => Display::fmt(error, formatter),
            Self::SerializationGate(error) => Display::fmt(error, formatter),
            Self::PrivateUpdateRoute(error) => Display::fmt(error, formatter),
            Self::PrivateUpdateNativeBridgeAdmission(error) => Display::fmt(error, formatter),
            Self::PrivateErrorBoundaryNativeExecution(error) => Display::fmt(error, formatter),
            Self::PrivateActNestedScopePassiveFlush(error) => Display::fmt(error, formatter),
            Self::PrivateUnmountNativeBridgeAdmission(error) => Display::fmt(error, formatter),
            Self::PrivateTestInstanceNativeQueryExecution(error) => Display::fmt(error, formatter),
            Self::PrivateRootLifecycleExecution(error) => Display::fmt(error, formatter),
            Self::PrivateJsonSerialization(error) => Display::fmt(error, formatter),
            Self::PrivateSerializationFinishedWorkIdentity(error) => Display::fmt(error, formatter),
            Self::StableSiblingInsertionCanary(error) => Display::fmt(error, formatter),
            Self::RootCreatePreflight(error) => Display::fmt(error, formatter),
            Self::PrivateCreateRouteAdmission(error) => Display::fmt(error, formatter),
            Self::HostOutputCanary(error) => Display::fmt(error, formatter),
            Self::FiberInspection(error) => Display::fmt(error, formatter),
            Self::MissingHostOutputFixture { element } => write!(
                formatter,
                "test-renderer host-output canary has no fixture for root element {}",
                element.raw()
            ),
            Self::MissingCommittedHostOutput { operation } => write!(
                formatter,
                "test-renderer host-output canary cannot {:?} without committed host output",
                operation
            ),
            Self::MissingHostParentPlacementApply {
                parent_state_node_raw,
                child_state_node_raw,
            } => write!(
                formatter,
                "test-renderer host-output canary did not receive a host-parent placement apply record for parent state node {parent_state_node_raw} and child state node {child_state_node_raw}",
            ),
            Self::MissingHostTextUpdateApply {
                current_text_slot,
                updated_text_slot,
                text_state_node_raw,
            } => write!(
                formatter,
                "test-renderer host-output canary did not receive a HostText update apply record from current text fiber slot {current_text_slot} to updated text fiber slot {updated_text_slot} for state node {text_state_node_raw}",
            ),
            Self::UnexpectedHostOutputUpdateKind { expected, actual } => write!(
                formatter,
                "test-renderer host-output canary expected a {:?} update, found {:?}",
                expected, actual
            ),
        }
    }
}

impl Error for TestRendererRootError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Host(error) => Some(error),
            Self::FiberRootStore(error) => Some(error),
            Self::RootUpdate(error) => Some(error),
            Self::RootScheduler(error) => Some(error),
            Self::RootWorkLoop(error) => Some(error),
            Self::RootCommit(error) => Some(error),
            Self::SerializationGate(error) => Some(error),
            Self::PrivateUpdateRoute(error) => Some(error),
            Self::PrivateUpdateNativeBridgeAdmission(error) => Some(error),
            Self::PrivateErrorBoundaryNativeExecution(error) => Some(error),
            Self::PrivateActNestedScopePassiveFlush(error) => Some(error),
            Self::PrivateUnmountNativeBridgeAdmission(error) => Some(error),
            Self::PrivateTestInstanceNativeQueryExecution(error) => Some(error),
            Self::PrivateRootLifecycleExecution(error) => Some(error),
            Self::PrivateJsonSerialization(error) => Some(error),
            Self::PrivateSerializationFinishedWorkIdentity(error) => Some(error),
            Self::StableSiblingInsertionCanary(error) => Some(error),
            Self::RootCreatePreflight(error) => Some(error),
            Self::PrivateCreateRouteAdmission(error) => Some(error),
            Self::HostOutputCanary(error) => Some(error),
            Self::FiberInspection(error) => Some(error),
            Self::MissingHostOutputFixture { .. }
            | Self::MissingCommittedHostOutput { .. }
            | Self::MissingHostParentPlacementApply { .. }
            | Self::MissingHostTextUpdateApply { .. }
            | Self::UnexpectedHostOutputUpdateKind { .. } => None,
        }
    }
}

impl From<HostError> for TestRendererRootError {
    fn from(error: HostError) -> Self {
        Self::Host(error)
    }
}

impl From<FiberRootStoreError> for TestRendererRootError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<RootUpdateError> for TestRendererRootError {
    fn from(error: RootUpdateError) -> Self {
        Self::RootUpdate(error)
    }
}

impl From<RootSchedulerError> for TestRendererRootError {
    fn from(error: RootSchedulerError) -> Self {
        Self::RootScheduler(error)
    }
}

impl From<RootWorkLoopError> for TestRendererRootError {
    fn from(error: RootWorkLoopError) -> Self {
        Self::RootWorkLoop(error)
    }
}

impl From<RootCommitError> for TestRendererRootError {
    fn from(error: RootCommitError) -> Self {
        Self::RootCommit(error)
    }
}

impl From<TestRendererSerializationGateError> for TestRendererRootError {
    fn from(error: TestRendererSerializationGateError) -> Self {
        Self::SerializationGate(Box::new(error))
    }
}

impl From<TestRendererPrivateUpdateRouteError> for TestRendererRootError {
    fn from(error: TestRendererPrivateUpdateRouteError) -> Self {
        Self::PrivateUpdateRoute(Box::new(error))
    }
}

impl From<TestRendererPrivateUpdateNativeBridgeAdmissionError> for TestRendererRootError {
    fn from(error: TestRendererPrivateUpdateNativeBridgeAdmissionError) -> Self {
        Self::PrivateUpdateNativeBridgeAdmission(Box::new(error))
    }
}

impl From<TestRendererPrivateErrorBoundaryNativeExecutionError> for TestRendererRootError {
    fn from(error: TestRendererPrivateErrorBoundaryNativeExecutionError) -> Self {
        Self::PrivateErrorBoundaryNativeExecution(Box::new(error))
    }
}

impl From<TestRendererPrivateActNestedScopePassiveFlushError> for TestRendererRootError {
    fn from(error: TestRendererPrivateActNestedScopePassiveFlushError) -> Self {
        Self::PrivateActNestedScopePassiveFlush(Box::new(error))
    }
}

impl From<TestRendererPrivateUnmountNativeBridgeAdmissionError> for TestRendererRootError {
    fn from(error: TestRendererPrivateUnmountNativeBridgeAdmissionError) -> Self {
        Self::PrivateUnmountNativeBridgeAdmission(Box::new(error))
    }
}

impl From<TestRendererPrivateTestInstanceNativeQueryExecutionError> for TestRendererRootError {
    fn from(error: TestRendererPrivateTestInstanceNativeQueryExecutionError) -> Self {
        Self::PrivateTestInstanceNativeQueryExecution(Box::new(error))
    }
}

impl From<TestRendererPrivateRootLifecycleExecutionError> for TestRendererRootError {
    fn from(error: TestRendererPrivateRootLifecycleExecutionError) -> Self {
        Self::PrivateRootLifecycleExecution(Box::new(error))
    }
}

impl From<TestRendererPrivateJsonSerializationError> for TestRendererRootError {
    fn from(error: TestRendererPrivateJsonSerializationError) -> Self {
        Self::PrivateJsonSerialization(Box::new(error))
    }
}

impl From<TestRendererPrivateSerializationFinishedWorkIdentityError> for TestRendererRootError {
    fn from(error: TestRendererPrivateSerializationFinishedWorkIdentityError) -> Self {
        Self::PrivateSerializationFinishedWorkIdentity(Box::new(error))
    }
}

impl From<TestRendererStableSiblingInsertionCanaryError> for TestRendererRootError {
    fn from(error: TestRendererStableSiblingInsertionCanaryError) -> Self {
        Self::StableSiblingInsertionCanary(Box::new(error))
    }
}

impl From<TestRendererRootCreatePreflightError> for TestRendererRootError {
    fn from(error: TestRendererRootCreatePreflightError) -> Self {
        Self::RootCreatePreflight(Box::new(error))
    }
}

impl From<TestRendererPrivateCreateRouteAdmissionError> for TestRendererRootError {
    fn from(error: TestRendererPrivateCreateRouteAdmissionError) -> Self {
        Self::PrivateCreateRouteAdmission(Box::new(error))
    }
}

impl From<TestRendererHostOutputCanaryError> for TestRendererRootError {
    fn from(error: TestRendererHostOutputCanaryError) -> Self {
        Self::HostOutputCanary(error)
    }
}

impl From<TestRendererCommittedFiberInspectionError> for TestRendererRootError {
    fn from(error: TestRendererCommittedFiberInspectionError) -> Self {
        Self::FiberInspection(error)
    }
}
