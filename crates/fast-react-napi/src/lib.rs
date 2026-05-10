//! Node-API boundary placeholder.
//!
//! This crate is the reserved native binding boundary. The initial scaffold
//! avoids pulling N-API dependencies until the binding strategy is implemented,
//! but no other Rust crate should grow Node-specific dependencies.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

mod handle_table;

#[allow(dead_code)]
mod root_bridge_requests {
    //! Private native root request records.
    //!
    //! The records in this module are inert diagnostics for the future native
    //! bridge. They only retain handle-table metadata and do not store raw
    //! JavaScript values, invoke the reconciler, or perform host work.

    use std::error::Error;
    use std::fmt::{self, Display, Formatter};

    use crate::handle_table::{
        BridgeEnvironmentId, BridgeHandle, BridgeHandleAdmissionOutcome, BridgeHandleTable,
        BridgeHandleTableError, PlaceholderRootRecord, PlaceholderValueRecord,
    };

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeRequestKind {
        Create,
        Render,
        Unmount,
    }

    impl NativeRootBridgeRequestKind {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::Create => "create",
                Self::Render => "render",
                Self::Unmount => "unmount",
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeRootHandleState {
        Active,
        Retired,
    }

    impl NativeRootBridgeRootHandleState {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::Active => "active",
                Self::Retired => "retired",
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeLifecycleTransition {
        NoneToActive,
        ActiveToActive,
        ActiveToRetired,
    }

    impl NativeRootBridgeLifecycleTransition {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::NoneToActive => "none->active",
                Self::ActiveToActive => "active->active",
                Self::ActiveToRetired => "active->retired",
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeCreateRequest {
        root_id: u64,
        container_handle: Option<BridgeHandle>,
    }

    impl NativeRootBridgeCreateRequest {
        #[must_use]
        pub(crate) const fn new(root_id: u64) -> Self {
            Self {
                root_id,
                container_handle: None,
            }
        }

        #[must_use]
        pub(crate) const fn with_container_handle(mut self, handle: BridgeHandle) -> Self {
            self.container_handle = Some(handle);
            self
        }

        #[must_use]
        pub(crate) const fn root_id(self) -> u64 {
            self.root_id
        }

        #[must_use]
        pub(crate) const fn container_handle(self) -> Option<BridgeHandle> {
            self.container_handle
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeRenderRequest {
        root_handle: BridgeHandle,
        element_handle: Option<BridgeHandle>,
    }

    impl NativeRootBridgeRenderRequest {
        #[must_use]
        pub(crate) const fn new(root_handle: BridgeHandle) -> Self {
            Self {
                root_handle,
                element_handle: None,
            }
        }

        #[must_use]
        pub(crate) const fn with_element_handle(mut self, handle: BridgeHandle) -> Self {
            self.element_handle = Some(handle);
            self
        }

        #[must_use]
        pub(crate) const fn root_handle(self) -> BridgeHandle {
            self.root_handle
        }

        #[must_use]
        pub(crate) const fn element_handle(self) -> Option<BridgeHandle> {
            self.element_handle
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeUnmountRequest {
        root_handle: BridgeHandle,
    }

    impl NativeRootBridgeUnmountRequest {
        #[must_use]
        pub(crate) const fn new(root_handle: BridgeHandle) -> Self {
            Self { root_handle }
        }

        #[must_use]
        pub(crate) const fn root_handle(self) -> BridgeHandle {
            self.root_handle
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeRequestRecord {
        request_id: u64,
        kind: NativeRootBridgeRequestKind,
        environment_id: BridgeEnvironmentId,
        root_handle: BridgeHandle,
        root_id: u64,
        value_handle: Option<BridgeHandle>,
        root_handle_state: NativeRootBridgeRootHandleState,
    }

    impl NativeRootBridgeRequestRecord {
        const fn new(
            request_id: u64,
            kind: NativeRootBridgeRequestKind,
            environment_id: BridgeEnvironmentId,
            root_handle: BridgeHandle,
            root_id: u64,
            value_handle: Option<BridgeHandle>,
            root_handle_state: NativeRootBridgeRootHandleState,
        ) -> Self {
            Self {
                request_id,
                kind,
                environment_id,
                root_handle,
                root_id,
                value_handle,
                root_handle_state,
            }
        }

        #[must_use]
        pub(crate) const fn from_js_native_handoff_record(
            request_id: u64,
            kind: NativeRootBridgeRequestKind,
            environment_id: BridgeEnvironmentId,
            root_handle: BridgeHandle,
            root_id: u64,
            value_handle: Option<BridgeHandle>,
            root_handle_state: NativeRootBridgeRootHandleState,
        ) -> Self {
            Self::new(
                request_id,
                kind,
                environment_id,
                root_handle,
                root_id,
                value_handle,
                root_handle_state,
            )
        }

        #[must_use]
        pub(crate) const fn request_id(self) -> u64 {
            self.request_id
        }

        #[must_use]
        pub(crate) const fn kind(self) -> NativeRootBridgeRequestKind {
            self.kind
        }

        #[must_use]
        pub(crate) const fn environment_id(self) -> BridgeEnvironmentId {
            self.environment_id
        }

        #[must_use]
        pub(crate) const fn root_handle(self) -> BridgeHandle {
            self.root_handle
        }

        #[must_use]
        pub(crate) const fn root_id(self) -> u64 {
            self.root_id
        }

        #[must_use]
        pub(crate) const fn value_handle(self) -> Option<BridgeHandle> {
            self.value_handle
        }

        #[must_use]
        pub(crate) const fn root_handle_state(self) -> NativeRootBridgeRootHandleState {
            self.root_handle_state
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeRequestValidationRecord {
        request_id: u64,
        kind: NativeRootBridgeRequestKind,
        environment_id: BridgeEnvironmentId,
        root_handle: BridgeHandle,
        root_id: u64,
        value_handle: Option<BridgeHandle>,
        root_handle_state: NativeRootBridgeRootHandleState,
        lifecycle_transition: NativeRootBridgeLifecycleTransition,
        root_handle_validated: bool,
        value_handle_validated: bool,
    }

    impl NativeRootBridgeRequestValidationRecord {
        const fn from_request(
            request: NativeRootBridgeRequestRecord,
            lifecycle_transition: NativeRootBridgeLifecycleTransition,
            value_handle_validated: bool,
        ) -> Self {
            Self {
                request_id: request.request_id(),
                kind: request.kind(),
                environment_id: request.environment_id(),
                root_handle: request.root_handle(),
                root_id: request.root_id(),
                value_handle: request.value_handle(),
                root_handle_state: request.root_handle_state(),
                lifecycle_transition,
                root_handle_validated: true,
                value_handle_validated,
            }
        }

        #[must_use]
        pub(crate) const fn request_id(self) -> u64 {
            self.request_id
        }

        #[must_use]
        pub(crate) const fn kind(self) -> NativeRootBridgeRequestKind {
            self.kind
        }

        #[must_use]
        pub(crate) const fn environment_id(self) -> BridgeEnvironmentId {
            self.environment_id
        }

        #[must_use]
        pub(crate) const fn root_handle(self) -> BridgeHandle {
            self.root_handle
        }

        #[must_use]
        pub(crate) const fn root_id(self) -> u64 {
            self.root_id
        }

        #[must_use]
        pub(crate) const fn value_handle(self) -> Option<BridgeHandle> {
            self.value_handle
        }

        #[must_use]
        pub(crate) const fn root_handle_state(self) -> NativeRootBridgeRootHandleState {
            self.root_handle_state
        }

        #[must_use]
        pub(crate) const fn lifecycle_transition(self) -> NativeRootBridgeLifecycleTransition {
            self.lifecycle_transition
        }

        #[must_use]
        pub(crate) const fn root_handle_validated(self) -> bool {
            self.root_handle_validated
        }

        #[must_use]
        pub(crate) const fn value_handle_validated(self) -> bool {
            self.value_handle_validated
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeHandleAdmissionAction {
        AdmitRootHandle,
        AdmitValueHandle,
        ValidateActiveRootHandle,
        ValidateValueHandle,
        RetireRootHandle,
        ValidateRetiredRootHandle,
    }

    impl NativeRootBridgeHandleAdmissionAction {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::AdmitRootHandle => "admit-root-handle",
                Self::AdmitValueHandle => "admit-value-handle",
                Self::ValidateActiveRootHandle => "validate-active-root-handle",
                Self::ValidateValueHandle => "validate-value-handle",
                Self::RetireRootHandle => "retire-root-handle",
                Self::ValidateRetiredRootHandle => "validate-retired-root-handle",
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeHandleTableAdmissionSmokeRecord {
        request_id: u64,
        kind: NativeRootBridgeRequestKind,
        lifecycle_transition: NativeRootBridgeLifecycleTransition,
        root_handle_state_before: Option<NativeRootBridgeRootHandleState>,
        root_handle_state_after: NativeRootBridgeRootHandleState,
        root_handle_action: NativeRootBridgeHandleAdmissionAction,
        root_handle_current_generation: u64,
        value_handle_action: Option<NativeRootBridgeHandleAdmissionAction>,
        value_handle_current_generation: Option<u64>,
        retired_root_source_error_code: Option<&'static str>,
    }

    impl NativeRootBridgeHandleTableAdmissionSmokeRecord {
        #[allow(clippy::too_many_arguments)]
        const fn new(
            request: NativeRootBridgeRequestRecord,
            lifecycle_transition: NativeRootBridgeLifecycleTransition,
            root_handle_state_before: Option<NativeRootBridgeRootHandleState>,
            root_handle_state_after: NativeRootBridgeRootHandleState,
            root_handle_action: NativeRootBridgeHandleAdmissionAction,
            root_handle_current_generation: u64,
            value_handle_action: Option<NativeRootBridgeHandleAdmissionAction>,
            value_handle_current_generation: Option<u64>,
            retired_root_source_error_code: Option<&'static str>,
        ) -> Self {
            Self {
                request_id: request.request_id(),
                kind: request.kind(),
                lifecycle_transition,
                root_handle_state_before,
                root_handle_state_after,
                root_handle_action,
                root_handle_current_generation,
                value_handle_action,
                value_handle_current_generation,
                retired_root_source_error_code,
            }
        }

        #[must_use]
        pub(crate) const fn request_id(self) -> u64 {
            self.request_id
        }

        #[must_use]
        pub(crate) const fn kind(self) -> NativeRootBridgeRequestKind {
            self.kind
        }

        #[must_use]
        pub(crate) const fn lifecycle_transition(self) -> NativeRootBridgeLifecycleTransition {
            self.lifecycle_transition
        }

        #[must_use]
        pub(crate) const fn root_handle_state_before(
            self,
        ) -> Option<NativeRootBridgeRootHandleState> {
            self.root_handle_state_before
        }

        #[must_use]
        pub(crate) const fn root_handle_state_after(self) -> NativeRootBridgeRootHandleState {
            self.root_handle_state_after
        }

        #[must_use]
        pub(crate) const fn root_handle_action(self) -> NativeRootBridgeHandleAdmissionAction {
            self.root_handle_action
        }

        #[must_use]
        pub(crate) const fn root_handle_current_generation(self) -> u64 {
            self.root_handle_current_generation
        }

        #[must_use]
        pub(crate) const fn value_handle_action(
            self,
        ) -> Option<NativeRootBridgeHandleAdmissionAction> {
            self.value_handle_action
        }

        #[must_use]
        pub(crate) const fn value_handle_current_generation(self) -> Option<u64> {
            self.value_handle_current_generation
        }

        #[must_use]
        pub(crate) const fn retired_root_source_error_code(self) -> Option<&'static str> {
            self.retired_root_source_error_code
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeHandleTableAdmissionSmoke {
        environment_id: BridgeEnvironmentId,
        root_handle: Option<BridgeHandle>,
        root_id: Option<u64>,
        root_retired: bool,
        admission_records: Vec<NativeRootBridgeHandleTableAdmissionSmokeRecord>,
        validation_records: Vec<NativeRootBridgeRequestValidationRecord>,
    }

    impl NativeRootBridgeHandleTableAdmissionSmoke {
        #[must_use]
        pub(crate) fn environment_id(&self) -> BridgeEnvironmentId {
            self.environment_id
        }

        #[must_use]
        pub(crate) fn root_handle(&self) -> Option<BridgeHandle> {
            self.root_handle
        }

        #[must_use]
        pub(crate) fn root_id(&self) -> Option<u64> {
            self.root_id
        }

        #[must_use]
        pub(crate) fn root_retired(&self) -> bool {
            self.root_retired
        }

        #[must_use]
        pub(crate) fn admission_records(
            &self,
        ) -> &[NativeRootBridgeHandleTableAdmissionSmokeRecord] {
            &self.admission_records
        }

        #[must_use]
        pub(crate) fn validation_records(&self) -> &[NativeRootBridgeRequestValidationRecord] {
            &self.validation_records
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeRequestError {
        HandleTable(BridgeHandleTableError),
        RecordEnvironmentMismatch {
            record_environment_id: BridgeEnvironmentId,
            table_environment_id: BridgeEnvironmentId,
        },
        RecordRootHandleMismatch {
            expected: BridgeHandle,
            actual: BridgeHandle,
        },
        RecordRootHandleStateMismatch {
            expected: NativeRootBridgeRootHandleState,
            actual: NativeRootBridgeRootHandleState,
        },
        RecordRootIdMismatch {
            expected: u64,
            actual: u64,
        },
        RootHandleStillActive {
            handle: BridgeHandle,
        },
        UnexpectedValueHandle {
            kind: NativeRootBridgeRequestKind,
            value_handle: BridgeHandle,
        },
        SequenceMustStartWithCreate {
            actual: NativeRootBridgeRequestKind,
        },
        CreateAfterRootCreated {
            request_id: u64,
        },
        RequestAfterUnmount {
            request_id: u64,
        },
        RequestSequenceOutOfOrder {
            previous_request_id: u64,
            request_id: u64,
        },
        RequestSequenceExhausted,
    }

    impl NativeRootBridgeRequestError {
        #[must_use]
        pub(crate) const fn code(&self) -> &'static str {
            match self {
                Self::HandleTable(error) => error.code(),
                Self::RecordEnvironmentMismatch { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_RECORD_ENVIRONMENT_MISMATCH"
                }
                Self::RecordRootHandleMismatch { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_MISMATCH"
                }
                Self::RecordRootHandleStateMismatch { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_STATE_MISMATCH"
                }
                Self::RecordRootIdMismatch { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_RECORD_ROOT_ID_MISMATCH"
                }
                Self::RootHandleStillActive { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_RETIRED_HANDLE_STILL_ACTIVE"
                }
                Self::UnexpectedValueHandle { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_UNEXPECTED_VALUE_HANDLE"
                }
                Self::SequenceMustStartWithCreate { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE"
                }
                Self::CreateAfterRootCreated { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_CREATE_AFTER_ROOT_CREATED"
                }
                Self::RequestAfterUnmount { .. } => "FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT",
                Self::RequestSequenceOutOfOrder { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_OUT_OF_ORDER"
                }
                Self::RequestSequenceExhausted => "FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_EXHAUSTED",
            }
        }
    }

    impl From<BridgeHandleTableError> for NativeRootBridgeRequestError {
        fn from(error: BridgeHandleTableError) -> Self {
            Self::HandleTable(error)
        }
    }

    impl Display for NativeRootBridgeRequestError {
        fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
            match self {
                Self::HandleTable(error) => Display::fmt(error, formatter),
                Self::RecordEnvironmentMismatch {
                    record_environment_id,
                    table_environment_id,
                } => write!(
                    formatter,
                    "native root bridge request record belongs to environment {}, expected environment {}",
                    record_environment_id.raw(),
                    table_environment_id.raw()
                ),
                Self::RecordRootHandleMismatch { expected, actual } => write!(
                    formatter,
                    "native root bridge request record uses root handle slot {}, expected slot {}",
                    actual.slot(),
                    expected.slot()
                ),
                Self::RecordRootHandleStateMismatch { expected, actual } => write!(
                    formatter,
                    "native root bridge request record has root handle state {:?}, expected {:?}",
                    actual, expected
                ),
                Self::RecordRootIdMismatch { expected, actual } => write!(
                    formatter,
                    "native root bridge request record has root id {actual}, expected {expected}"
                ),
                Self::RootHandleStillActive { handle } => write!(
                    formatter,
                    "native root bridge unmount record did not retire root handle slot {}",
                    handle.slot()
                ),
                Self::UnexpectedValueHandle { kind, .. } => write!(
                    formatter,
                    "native root bridge {} record cannot carry a value handle",
                    kind.code()
                ),
                Self::SequenceMustStartWithCreate { actual } => write!(
                    formatter,
                    "native root bridge request sequence must start with create, got {}",
                    actual.code()
                ),
                Self::CreateAfterRootCreated { request_id } => write!(
                    formatter,
                    "native root bridge request {request_id} attempted to create another root in an active sequence"
                ),
                Self::RequestAfterUnmount { request_id } => write!(
                    formatter,
                    "native root bridge request {request_id} was recorded after root unmount"
                ),
                Self::RequestSequenceOutOfOrder {
                    previous_request_id,
                    request_id,
                } => write!(
                    formatter,
                    "native root bridge request id {request_id} must be greater than previous request id {previous_request_id}"
                ),
                Self::RequestSequenceExhausted => formatter
                    .write_str("native root bridge request sequence cannot allocate another id"),
            }
        }
    }

    impl Error for NativeRootBridgeRequestError {}

    #[derive(Debug, Clone)]
    pub(crate) struct NativeRootBridgeRequestSequenceValidator {
        root_handle: Option<BridgeHandle>,
        root_id: Option<u64>,
        last_request_id: Option<u64>,
        root_retired: bool,
    }

    impl Default for NativeRootBridgeRequestSequenceValidator {
        fn default() -> Self {
            Self::new()
        }
    }

    impl NativeRootBridgeRequestSequenceValidator {
        #[must_use]
        pub(crate) const fn new() -> Self {
            Self {
                root_handle: None,
                root_id: None,
                last_request_id: None,
                root_retired: false,
            }
        }

        #[must_use]
        pub(crate) const fn root_handle(&self) -> Option<BridgeHandle> {
            self.root_handle
        }

        #[must_use]
        pub(crate) const fn root_id(&self) -> Option<u64> {
            self.root_id
        }

        #[must_use]
        pub(crate) const fn last_request_id(&self) -> Option<u64> {
            self.last_request_id
        }

        #[must_use]
        pub(crate) const fn root_retired(&self) -> bool {
            self.root_retired
        }

        pub(crate) fn validate_next(
            &mut self,
            table: &BridgeHandleTable,
            request: NativeRootBridgeRequestRecord,
        ) -> Result<NativeRootBridgeRequestValidationRecord, NativeRootBridgeRequestError> {
            self.validate_request_order(request.request_id())?;

            if self.root_retired {
                return Err(NativeRootBridgeRequestError::RequestAfterUnmount {
                    request_id: request.request_id(),
                });
            }

            let validation = match self.root_handle {
                None => {
                    if request.kind() != NativeRootBridgeRequestKind::Create {
                        return Err(NativeRootBridgeRequestError::SequenceMustStartWithCreate {
                            actual: request.kind(),
                        });
                    }

                    validate_create_record(table, request)?
                }
                Some(root_handle) => {
                    if request.kind() == NativeRootBridgeRequestKind::Create {
                        return Err(NativeRootBridgeRequestError::CreateAfterRootCreated {
                            request_id: request.request_id(),
                        });
                    }

                    validate_sequence_root_identity(
                        request,
                        root_handle,
                        self.root_id
                            .expect("root id is present when root handle is set"),
                    )?;

                    match request.kind() {
                        NativeRootBridgeRequestKind::Create => {
                            unreachable!("create requests are rejected above")
                        }
                        NativeRootBridgeRequestKind::Render => {
                            validate_render_record(table, request)?
                        }
                        NativeRootBridgeRequestKind::Unmount => {
                            validate_unmount_record(table, request)?
                        }
                    }
                }
            };

            self.last_request_id = Some(request.request_id());

            if self.root_handle.is_none() {
                self.root_handle = Some(request.root_handle());
                self.root_id = Some(request.root_id());
            }

            if request.kind() == NativeRootBridgeRequestKind::Unmount {
                self.root_retired = true;
            }

            Ok(validation)
        }

        fn validate_request_order(
            &self,
            request_id: u64,
        ) -> Result<(), NativeRootBridgeRequestError> {
            let Some(previous_request_id) = self.last_request_id else {
                return Ok(());
            };

            if request_id > previous_request_id {
                return Ok(());
            }

            Err(NativeRootBridgeRequestError::RequestSequenceOutOfOrder {
                previous_request_id,
                request_id,
            })
        }
    }

    #[derive(Debug, Clone)]
    pub(crate) struct NativeRootBridgeRequestRecorder {
        next_request_id: u64,
    }

    impl Default for NativeRootBridgeRequestRecorder {
        fn default() -> Self {
            Self::new()
        }
    }

    impl NativeRootBridgeRequestRecorder {
        #[must_use]
        pub(crate) const fn new() -> Self {
            Self { next_request_id: 1 }
        }

        pub(crate) fn record_create_root(
            &mut self,
            table: &mut BridgeHandleTable,
            request: NativeRootBridgeCreateRequest,
        ) -> Result<NativeRootBridgeRequestRecord, NativeRootBridgeRequestError> {
            if let Some(container_handle) = request.container_handle() {
                table.get_value(container_handle)?;
            }

            let request_id = self.allocate_request_id()?;
            let root_handle = table.insert_root(PlaceholderRootRecord::new(request.root_id()));

            Ok(NativeRootBridgeRequestRecord::new(
                request_id,
                NativeRootBridgeRequestKind::Create,
                table.environment_id(),
                root_handle,
                request.root_id(),
                request.container_handle(),
                NativeRootBridgeRootHandleState::Active,
            ))
        }

        pub(crate) fn record_render(
            &mut self,
            table: &BridgeHandleTable,
            request: NativeRootBridgeRenderRequest,
        ) -> Result<NativeRootBridgeRequestRecord, NativeRootBridgeRequestError> {
            let root = table.get_root(request.root_handle())?;

            if let Some(element_handle) = request.element_handle() {
                table.get_value(element_handle)?;
            }

            let request_id = self.allocate_request_id()?;

            Ok(NativeRootBridgeRequestRecord::new(
                request_id,
                NativeRootBridgeRequestKind::Render,
                table.environment_id(),
                request.root_handle(),
                root.root_id(),
                request.element_handle(),
                NativeRootBridgeRootHandleState::Active,
            ))
        }

        pub(crate) fn record_unmount(
            &mut self,
            table: &mut BridgeHandleTable,
            request: NativeRootBridgeUnmountRequest,
        ) -> Result<NativeRootBridgeRequestRecord, NativeRootBridgeRequestError> {
            let root_id = table.get_root(request.root_handle())?.root_id();
            let request_id = self.allocate_request_id()?;
            let removed = table.remove_root(request.root_handle())?;
            debug_assert_eq!(removed.root_id(), root_id);

            Ok(NativeRootBridgeRequestRecord::new(
                request_id,
                NativeRootBridgeRequestKind::Unmount,
                table.environment_id(),
                request.root_handle(),
                root_id,
                None,
                NativeRootBridgeRootHandleState::Retired,
            ))
        }

        fn allocate_request_id(&mut self) -> Result<u64, NativeRootBridgeRequestError> {
            let request_id = self.next_request_id;
            self.next_request_id = self
                .next_request_id
                .checked_add(1)
                .ok_or(NativeRootBridgeRequestError::RequestSequenceExhausted)?;
            Ok(request_id)
        }
    }

    pub(crate) fn smoke_admit_js_native_root_bridge_handoff_records(
        requests: &[NativeRootBridgeRequestRecord],
    ) -> Result<NativeRootBridgeHandleTableAdmissionSmoke, NativeRootBridgeRequestError> {
        let environment_id = requests
            .first()
            .map_or(BridgeEnvironmentId::NONE, |request| {
                request.environment_id()
            });
        let mut table = BridgeHandleTable::new(environment_id);
        let mut validator = NativeRootBridgeRequestSequenceValidator::new();
        let mut admission_records = Vec::with_capacity(requests.len());
        let mut validation_records = Vec::with_capacity(requests.len());
        let mut root_handle_state = None;

        for request in requests.iter().copied() {
            let admission_record =
                admit_js_native_root_bridge_handoff_record(&mut table, request, root_handle_state)?;
            let validation_record = validator.validate_next(&table, request)?;

            root_handle_state = Some(validation_record.root_handle_state());
            admission_records.push(admission_record);
            validation_records.push(validation_record);
        }

        Ok(NativeRootBridgeHandleTableAdmissionSmoke {
            environment_id,
            root_handle: validator.root_handle(),
            root_id: validator.root_id(),
            root_retired: validator.root_retired(),
            admission_records,
            validation_records,
        })
    }

    fn admit_js_native_root_bridge_handoff_record(
        table: &mut BridgeHandleTable,
        request: NativeRootBridgeRequestRecord,
        root_handle_state_before: Option<NativeRootBridgeRootHandleState>,
    ) -> Result<NativeRootBridgeHandleTableAdmissionSmokeRecord, NativeRootBridgeRequestError> {
        validate_record_environment(table, request)?;

        match request.kind() {
            NativeRootBridgeRequestKind::Create => {
                validate_root_handle_state(request, NativeRootBridgeRootHandleState::Active)?;

                let root_admission = table.admit_root_handoff_handle(
                    request.root_handle(),
                    PlaceholderRootRecord::new(request.root_id()),
                )?;
                let value_admission = if let Some(value_handle) = request.value_handle() {
                    Some(table.admit_value_handoff_handle(
                        value_handle,
                        PlaceholderValueRecord::new(request.request_id()),
                    )?)
                } else {
                    None
                };

                Ok(NativeRootBridgeHandleTableAdmissionSmokeRecord::new(
                    request,
                    NativeRootBridgeLifecycleTransition::NoneToActive,
                    root_handle_state_before,
                    NativeRootBridgeRootHandleState::Active,
                    NativeRootBridgeHandleAdmissionAction::AdmitRootHandle,
                    root_admission.current_generation(),
                    value_admission.map(value_handoff_admission_action),
                    value_admission.map(|admission| admission.current_generation()),
                    None,
                ))
            }
            NativeRootBridgeRequestKind::Render => {
                validate_root_handle_state(request, NativeRootBridgeRootHandleState::Active)?;
                let root = table.get_root(request.root_handle())?;
                validate_root_id(request, root.root_id())?;

                let value_admission = if let Some(value_handle) = request.value_handle() {
                    Some(table.admit_value_handoff_handle(
                        value_handle,
                        PlaceholderValueRecord::new(request.request_id()),
                    )?)
                } else {
                    None
                };

                Ok(NativeRootBridgeHandleTableAdmissionSmokeRecord::new(
                    request,
                    NativeRootBridgeLifecycleTransition::ActiveToActive,
                    root_handle_state_before,
                    NativeRootBridgeRootHandleState::Active,
                    NativeRootBridgeHandleAdmissionAction::ValidateActiveRootHandle,
                    request.root_handle().generation(),
                    value_admission.map(value_handoff_admission_action),
                    value_admission.map(|admission| admission.current_generation()),
                    None,
                ))
            }
            NativeRootBridgeRequestKind::Unmount => {
                validate_root_handle_state(request, NativeRootBridgeRootHandleState::Retired)?;

                if let Some(value_handle) = request.value_handle() {
                    return Err(NativeRootBridgeRequestError::UnexpectedValueHandle {
                        kind: request.kind(),
                        value_handle,
                    });
                }

                let root = table.get_root(request.root_handle())?;
                validate_root_id(request, root.root_id())?;
                table.remove_root(request.root_handle())?;

                let (retired_root_current_generation, retired_root_source_error_code) =
                    match table.get_root(request.root_handle()) {
                        Ok(_) => {
                            return Err(NativeRootBridgeRequestError::RootHandleStillActive {
                                handle: request.root_handle(),
                            });
                        }
                        Err(
                            error @ BridgeHandleTableError::StaleHandle {
                                current_generation, ..
                            },
                        ) => (current_generation, Some(error.code())),
                        Err(error) => return Err(NativeRootBridgeRequestError::HandleTable(error)),
                    };

                Ok(NativeRootBridgeHandleTableAdmissionSmokeRecord::new(
                    request,
                    NativeRootBridgeLifecycleTransition::ActiveToRetired,
                    root_handle_state_before,
                    NativeRootBridgeRootHandleState::Retired,
                    NativeRootBridgeHandleAdmissionAction::RetireRootHandle,
                    retired_root_current_generation,
                    None,
                    None,
                    retired_root_source_error_code,
                ))
            }
        }
    }

    fn value_handoff_admission_action(
        admission: crate::handle_table::BridgeHandleAdmission,
    ) -> NativeRootBridgeHandleAdmissionAction {
        match admission.outcome() {
            BridgeHandleAdmissionOutcome::Admitted => {
                NativeRootBridgeHandleAdmissionAction::AdmitValueHandle
            }
            BridgeHandleAdmissionOutcome::Validated => {
                NativeRootBridgeHandleAdmissionAction::ValidateValueHandle
            }
        }
    }

    fn validate_create_record(
        table: &BridgeHandleTable,
        request: NativeRootBridgeRequestRecord,
    ) -> Result<NativeRootBridgeRequestValidationRecord, NativeRootBridgeRequestError> {
        validate_record_environment(table, request)?;
        validate_root_handle_state(request, NativeRootBridgeRootHandleState::Active)?;

        let root = table.get_root(request.root_handle())?;
        validate_root_id(request, root.root_id())?;
        let value_handle_validated = validate_optional_value_handle(table, request)?;

        Ok(NativeRootBridgeRequestValidationRecord::from_request(
            request,
            NativeRootBridgeLifecycleTransition::NoneToActive,
            value_handle_validated,
        ))
    }

    fn validate_render_record(
        table: &BridgeHandleTable,
        request: NativeRootBridgeRequestRecord,
    ) -> Result<NativeRootBridgeRequestValidationRecord, NativeRootBridgeRequestError> {
        validate_record_environment(table, request)?;
        validate_root_handle_state(request, NativeRootBridgeRootHandleState::Active)?;

        let root = table.get_root(request.root_handle())?;
        validate_root_id(request, root.root_id())?;
        let value_handle_validated = validate_optional_value_handle(table, request)?;

        Ok(NativeRootBridgeRequestValidationRecord::from_request(
            request,
            NativeRootBridgeLifecycleTransition::ActiveToActive,
            value_handle_validated,
        ))
    }

    fn validate_unmount_record(
        table: &BridgeHandleTable,
        request: NativeRootBridgeRequestRecord,
    ) -> Result<NativeRootBridgeRequestValidationRecord, NativeRootBridgeRequestError> {
        validate_record_environment(table, request)?;
        validate_root_handle_state(request, NativeRootBridgeRootHandleState::Retired)?;

        if let Some(value_handle) = request.value_handle() {
            return Err(NativeRootBridgeRequestError::UnexpectedValueHandle {
                kind: request.kind(),
                value_handle,
            });
        }

        match table.get_root(request.root_handle()) {
            Ok(_) => Err(NativeRootBridgeRequestError::RootHandleStillActive {
                handle: request.root_handle(),
            }),
            Err(BridgeHandleTableError::StaleHandle { .. }) => {
                Ok(NativeRootBridgeRequestValidationRecord::from_request(
                    request,
                    NativeRootBridgeLifecycleTransition::ActiveToRetired,
                    false,
                ))
            }
            Err(error) => Err(NativeRootBridgeRequestError::HandleTable(error)),
        }
    }

    fn validate_sequence_root_identity(
        request: NativeRootBridgeRequestRecord,
        expected_root_handle: BridgeHandle,
        expected_root_id: u64,
    ) -> Result<(), NativeRootBridgeRequestError> {
        if request.root_handle() != expected_root_handle {
            return Err(NativeRootBridgeRequestError::RecordRootHandleMismatch {
                expected: expected_root_handle,
                actual: request.root_handle(),
            });
        }

        if request.root_id() != expected_root_id {
            return Err(NativeRootBridgeRequestError::RecordRootIdMismatch {
                expected: expected_root_id,
                actual: request.root_id(),
            });
        }

        Ok(())
    }

    fn validate_record_environment(
        table: &BridgeHandleTable,
        request: NativeRootBridgeRequestRecord,
    ) -> Result<(), NativeRootBridgeRequestError> {
        if request.environment_id() == table.environment_id() {
            return Ok(());
        }

        Err(NativeRootBridgeRequestError::RecordEnvironmentMismatch {
            record_environment_id: request.environment_id(),
            table_environment_id: table.environment_id(),
        })
    }

    fn validate_root_handle_state(
        request: NativeRootBridgeRequestRecord,
        expected: NativeRootBridgeRootHandleState,
    ) -> Result<(), NativeRootBridgeRequestError> {
        let actual = request.root_handle_state();
        if actual == expected {
            return Ok(());
        }

        Err(NativeRootBridgeRequestError::RecordRootHandleStateMismatch { expected, actual })
    }

    fn validate_root_id(
        request: NativeRootBridgeRequestRecord,
        actual: u64,
    ) -> Result<(), NativeRootBridgeRequestError> {
        if request.root_id() == actual {
            return Ok(());
        }

        Err(NativeRootBridgeRequestError::RecordRootIdMismatch {
            expected: request.root_id(),
            actual,
        })
    }

    fn validate_optional_value_handle(
        table: &BridgeHandleTable,
        request: NativeRootBridgeRequestRecord,
    ) -> Result<bool, NativeRootBridgeRequestError> {
        let Some(value_handle) = request.value_handle() else {
            return Ok(false);
        };

        table.get_value(value_handle)?;
        Ok(true)
    }
}

pub const BINDING_PACKAGE_NAME: &str = "@fast-react/native";
pub const NAPI_BOUNDARY_STATUS: &str = "placeholder";
pub const NATIVE_ADDON_NAME: &str = "fast_react_napi";
pub const NODE_API_VERSION_FLOOR: u32 = 8;
pub const SUPPORTED_NODE_ENGINE_RANGE: &str = ">=22.0.0";
pub const PLATFORM_ARTIFACT_POLICY: &str =
    "future per-platform optional npm packages; no native addon is built or loaded yet";
pub const OPTIONAL_PACKAGE_PREFIX: &str = "@fast-react/native-";
pub const NATIVE_ROOT_BRIDGE_JS_REQUEST_SHAPE_GATE_STATUS: &str =
    "admitted-native-root-bridge-js-request-shape";
pub const NATIVE_ROOT_BRIDGE_HANDLE_ADMISSION_PREFLIGHT_STATUS: &str =
    "preflighted-native-root-bridge-real-handle-admission";
pub const NATIVE_ROOT_BRIDGE_RUST_HANDLE_TABLE_ADMISSION_SMOKE_STATUS: &str =
    "mirrored-native-root-bridge-rust-handle-table-admission-smoke";
pub const NATIVE_ROOT_BRIDGE_REQUEST_VALIDATION_MODEL: &str =
    "fast-react-napi.NativeRootBridgeRequestSequenceValidator";
pub const NATIVE_ROOT_BRIDGE_HANDLE_TABLE_MODEL: &str = "fast-react-napi.BridgeHandleTable";
pub const NATIVE_ROOT_BRIDGE_JS_REQUEST_RECORD_FIELDS: &[&str] = &[
    "requestId",
    "kind",
    "environmentId",
    "rootHandle",
    "rootId",
    "valueHandle",
    "rootHandleState",
];
pub const NATIVE_ROOT_BRIDGE_RUST_REQUEST_RECORD_FIELDS: &[&str] = &[
    "request_id",
    "kind",
    "environment_id",
    "root_handle",
    "root_id",
    "value_handle",
    "root_handle_state",
];
pub const NATIVE_ROOT_BRIDGE_RUST_VALIDATION_RECORD_FIELDS: &[&str] = &[
    "request_id",
    "kind",
    "environment_id",
    "root_handle",
    "root_id",
    "value_handle",
    "root_handle_state",
    "lifecycle_transition",
    "root_handle_validated",
    "value_handle_validated",
];
pub const NATIVE_ROOT_BRIDGE_JS_HANDLE_FIELDS: &[&str] =
    &["environmentId", "slot", "generation", "kind"];
pub const NATIVE_ROOT_BRIDGE_RUST_HANDLE_FIELDS: &[&str] =
    &["environment_id", "slot", "generation", "kind"];
pub const NATIVE_ROOT_BRIDGE_REQUEST_KIND_CODES: &[&str] = &["create", "render", "unmount"];
pub const NATIVE_ROOT_BRIDGE_HANDLE_KIND_CODES: &[&str] = &["root", "value"];
pub const NATIVE_ROOT_BRIDGE_ROOT_HANDLE_STATE_CODES: &[&str] = &["active", "retired"];
pub const NATIVE_ROOT_BRIDGE_LIFECYCLE_TRANSITION_CODES: &[&str] =
    &["none->active", "active->active", "active->retired"];
pub const NATIVE_ROOT_BRIDGE_HANDLE_ADMISSION_ACTION_CODES: &[&str] = &[
    "admit-root-handle",
    "admit-value-handle",
    "validate-active-root-handle",
    "validate-value-handle",
    "retire-root-handle",
    "validate-retired-root-handle",
];
pub const NATIVE_ROOT_BRIDGE_RUST_HANDLE_TABLE_ADMISSION_SMOKE_RECORD_FIELDS: &[&str] = &[
    "request_id",
    "kind",
    "lifecycle_transition",
    "root_handle_state_before",
    "root_handle_state_after",
    "root_handle_action",
    "root_handle_current_generation",
    "value_handle_action",
    "value_handle_current_generation",
    "retired_root_source_error_code",
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NativeTargetMetadata {
    native_target: &'static str,
    platform: &'static str,
    architecture: &'static str,
    libc: Option<&'static str>,
    toolchain: Option<&'static str>,
    optional_package_name: &'static str,
    native_file_name: &'static str,
}

impl NativeTargetMetadata {
    #[must_use]
    pub const fn native_target(&self) -> &'static str {
        self.native_target
    }

    #[must_use]
    pub const fn platform(&self) -> &'static str {
        self.platform
    }

    #[must_use]
    pub const fn architecture(&self) -> &'static str {
        self.architecture
    }

    #[must_use]
    pub const fn libc(&self) -> Option<&'static str> {
        self.libc
    }

    #[must_use]
    pub const fn toolchain(&self) -> Option<&'static str> {
        self.toolchain
    }

    #[must_use]
    pub const fn optional_package_name(&self) -> &'static str {
        self.optional_package_name
    }

    #[must_use]
    pub const fn native_file_name(&self) -> &'static str {
        self.native_file_name
    }
}

pub const NATIVE_TARGET_MATRIX: &[NativeTargetMetadata] = &[
    NativeTargetMetadata {
        native_target: "darwin-arm64",
        platform: "darwin",
        architecture: "arm64",
        libc: None,
        toolchain: None,
        optional_package_name: "@fast-react/native-darwin-arm64",
        native_file_name: "fast_react_napi.darwin-arm64.node",
    },
    NativeTargetMetadata {
        native_target: "darwin-x64",
        platform: "darwin",
        architecture: "x64",
        libc: None,
        toolchain: None,
        optional_package_name: "@fast-react/native-darwin-x64",
        native_file_name: "fast_react_napi.darwin-x64.node",
    },
    NativeTargetMetadata {
        native_target: "linux-arm64-gnu",
        platform: "linux",
        architecture: "arm64",
        libc: Some("gnu"),
        toolchain: None,
        optional_package_name: "@fast-react/native-linux-arm64-gnu",
        native_file_name: "fast_react_napi.linux-arm64-gnu.node",
    },
    NativeTargetMetadata {
        native_target: "linux-arm64-musl",
        platform: "linux",
        architecture: "arm64",
        libc: Some("musl"),
        toolchain: None,
        optional_package_name: "@fast-react/native-linux-arm64-musl",
        native_file_name: "fast_react_napi.linux-arm64-musl.node",
    },
    NativeTargetMetadata {
        native_target: "linux-x64-gnu",
        platform: "linux",
        architecture: "x64",
        libc: Some("gnu"),
        toolchain: None,
        optional_package_name: "@fast-react/native-linux-x64-gnu",
        native_file_name: "fast_react_napi.linux-x64-gnu.node",
    },
    NativeTargetMetadata {
        native_target: "linux-x64-musl",
        platform: "linux",
        architecture: "x64",
        libc: Some("musl"),
        toolchain: None,
        optional_package_name: "@fast-react/native-linux-x64-musl",
        native_file_name: "fast_react_napi.linux-x64-musl.node",
    },
    NativeTargetMetadata {
        native_target: "win32-arm64-msvc",
        platform: "win32",
        architecture: "arm64",
        libc: None,
        toolchain: Some("msvc"),
        optional_package_name: "@fast-react/native-win32-arm64-msvc",
        native_file_name: "fast_react_napi.win32-arm64-msvc.node",
    },
    NativeTargetMetadata {
        native_target: "win32-x64-msvc",
        platform: "win32",
        architecture: "x64",
        libc: None,
        toolchain: Some("msvc"),
        optional_package_name: "@fast-react/native-win32-x64-msvc",
        native_file_name: "fast_react_napi.win32-x64-msvc.node",
    },
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NativeBoundaryMetadata {
    package_name: &'static str,
    status: &'static str,
    native_addon_name: &'static str,
    node_api_version_floor: u32,
    supported_node_engine_range: &'static str,
    platform_artifact_policy: &'static str,
}

impl NativeBoundaryMetadata {
    #[must_use]
    pub const fn package_name(&self) -> &'static str {
        self.package_name
    }

    #[must_use]
    pub const fn status(&self) -> &'static str {
        self.status
    }

    #[must_use]
    pub const fn native_addon_name(&self) -> &'static str {
        self.native_addon_name
    }

    #[must_use]
    pub const fn node_api_version_floor(&self) -> u32 {
        self.node_api_version_floor
    }

    #[must_use]
    pub const fn supported_node_engine_range(&self) -> &'static str {
        self.supported_node_engine_range
    }

    #[must_use]
    pub const fn platform_artifact_policy(&self) -> &'static str {
        self.platform_artifact_policy
    }

    #[must_use]
    pub const fn native_target_count(&self) -> usize {
        NATIVE_TARGET_MATRIX.len()
    }
}

#[must_use]
pub const fn boundary_metadata() -> NativeBoundaryMetadata {
    NativeBoundaryMetadata {
        package_name: BINDING_PACKAGE_NAME,
        status: NAPI_BOUNDARY_STATUS,
        native_addon_name: NATIVE_ADDON_NAME,
        node_api_version_floor: NODE_API_VERSION_FLOOR,
        supported_node_engine_range: SUPPORTED_NODE_ENGINE_RANGE,
        platform_artifact_policy: PLATFORM_ARTIFACT_POLICY,
    }
}

#[must_use]
pub const fn binding_status() -> &'static str {
    NAPI_BOUNDARY_STATUS
}

#[must_use]
pub const fn native_target_matrix() -> &'static [NativeTargetMetadata] {
    NATIVE_TARGET_MATRIX
}

#[must_use]
pub fn native_target_metadata(native_target: &str) -> Option<&'static NativeTargetMetadata> {
    NATIVE_TARGET_MATRIX
        .iter()
        .find(|target| target.native_target() == native_target)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NativeBoundaryErrorKind {
    NativeExportsNotBuilt,
    RootBridgeWrongEnvironment,
    RootBridgeStaleHandle,
    RootBridgeWrongLifecycleOrder,
    RootBridgeValidationFailed,
}

impl NativeBoundaryErrorKind {
    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::NativeExportsNotBuilt => "FAST_REACT_NAPI_EXPORTS_NOT_BUILT",
            Self::RootBridgeWrongEnvironment => "FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_ENVIRONMENT",
            Self::RootBridgeStaleHandle => "FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE",
            Self::RootBridgeWrongLifecycleOrder => {
                "FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"
            }
            Self::RootBridgeValidationFailed => "FAST_REACT_NAPI_ROOT_BRIDGE_VALIDATION_FAILED",
        }
    }

    #[must_use]
    pub const fn reason(self) -> &'static str {
        match self {
            Self::NativeExportsNotBuilt => {
                "Fast React native exports are intentionally unavailable until N-API dependencies are added"
            }
            Self::RootBridgeWrongEnvironment => {
                "A native root bridge request referenced the wrong bridge environment"
            }
            Self::RootBridgeStaleHandle => {
                "A native root bridge request referenced a stale or retired bridge handle"
            }
            Self::RootBridgeWrongLifecycleOrder => {
                "A native root bridge request arrived in an invalid root lifecycle order"
            }
            Self::RootBridgeValidationFailed => {
                "A native root bridge request failed private boundary validation"
            }
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NativeBoundaryError {
    export_name: &'static str,
    kind: NativeBoundaryErrorKind,
    source_error_code: Option<&'static str>,
}

impl NativeBoundaryError {
    #[must_use]
    pub const fn native_exports_not_built(export_name: &'static str) -> Self {
        Self {
            export_name,
            kind: NativeBoundaryErrorKind::NativeExportsNotBuilt,
            source_error_code: None,
        }
    }

    #[must_use]
    pub(crate) const fn root_bridge_validation_failure(
        export_name: &'static str,
        kind: NativeBoundaryErrorKind,
        source_error_code: &'static str,
    ) -> Self {
        Self {
            export_name,
            kind,
            source_error_code: Some(source_error_code),
        }
    }

    #[must_use]
    pub const fn export_name(&self) -> &'static str {
        self.export_name
    }

    #[must_use]
    pub const fn kind(&self) -> NativeBoundaryErrorKind {
        self.kind
    }

    #[must_use]
    pub const fn code(&self) -> &'static str {
        self.kind.code()
    }

    #[must_use]
    pub const fn reason(&self) -> &'static str {
        self.kind.reason()
    }

    #[must_use]
    pub const fn source_error_code(&self) -> Option<&'static str> {
        self.source_error_code
    }

    #[must_use]
    pub const fn metadata(&self) -> NativeBoundaryMetadata {
        boundary_metadata()
    }
}

impl Display for NativeBoundaryError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        write!(
            formatter,
            "{}: {} ({}, package={}, addon={}, node_api_floor={}",
            self.export_name,
            self.reason(),
            self.code(),
            self.metadata().package_name(),
            self.metadata().native_addon_name(),
            self.metadata().node_api_version_floor()
        )?;

        if let Some(source_error_code) = self.source_error_code {
            write!(formatter, ", source={source_error_code}")?;
        }

        formatter.write_str(")")
    }
}

impl Error for NativeBoundaryError {}

pub fn native_export_placeholder(export_name: &'static str) -> Result<(), NativeBoundaryError> {
    Err(NativeBoundaryError::native_exports_not_built(export_name))
}

#[allow(dead_code)]
pub(crate) fn native_root_bridge_validation_placeholder(
    export_name: &'static str,
    error: &root_bridge_requests::NativeRootBridgeRequestError,
) -> NativeBoundaryError {
    NativeBoundaryError::root_bridge_validation_failure(
        export_name,
        native_boundary_kind_for_root_bridge_request_error(error),
        error.code(),
    )
}

fn native_boundary_kind_for_root_bridge_request_error(
    error: &root_bridge_requests::NativeRootBridgeRequestError,
) -> NativeBoundaryErrorKind {
    match error {
        root_bridge_requests::NativeRootBridgeRequestError::HandleTable(
            handle_table::BridgeHandleTableError::WrongEnvironment { .. },
        )
        | root_bridge_requests::NativeRootBridgeRequestError::RecordEnvironmentMismatch {
            ..
        } => NativeBoundaryErrorKind::RootBridgeWrongEnvironment,
        root_bridge_requests::NativeRootBridgeRequestError::HandleTable(
            handle_table::BridgeHandleTableError::StaleHandle { .. }
            | handle_table::BridgeHandleTableError::DisposedHandle { .. },
        ) => NativeBoundaryErrorKind::RootBridgeStaleHandle,
        root_bridge_requests::NativeRootBridgeRequestError::RecordRootHandleStateMismatch {
            ..
        }
        | root_bridge_requests::NativeRootBridgeRequestError::RootHandleStillActive { .. }
        | root_bridge_requests::NativeRootBridgeRequestError::SequenceMustStartWithCreate {
            ..
        }
        | root_bridge_requests::NativeRootBridgeRequestError::CreateAfterRootCreated { .. }
        | root_bridge_requests::NativeRootBridgeRequestError::RequestAfterUnmount { .. }
        | root_bridge_requests::NativeRootBridgeRequestError::RequestSequenceOutOfOrder {
            ..
        }
        | root_bridge_requests::NativeRootBridgeRequestError::RequestSequenceExhausted => {
            NativeBoundaryErrorKind::RootBridgeWrongLifecycleOrder
        }
        root_bridge_requests::NativeRootBridgeRequestError::HandleTable(_)
        | root_bridge_requests::NativeRootBridgeRequestError::RecordRootHandleMismatch { .. }
        | root_bridge_requests::NativeRootBridgeRequestError::RecordRootIdMismatch { .. }
        | root_bridge_requests::NativeRootBridgeRequestError::UnexpectedValueHandle { .. } => {
            NativeBoundaryErrorKind::RootBridgeValidationFailed
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::handle_table::{
        BridgeEnvironmentId, BridgeHandle, BridgeHandleKind, BridgeHandleTable,
        BridgeHandleTableError, PlaceholderRootRecord, PlaceholderValueRecord,
    };
    use crate::root_bridge_requests::{
        NativeRootBridgeCreateRequest, NativeRootBridgeHandleAdmissionAction,
        NativeRootBridgeLifecycleTransition, NativeRootBridgeRenderRequest,
        NativeRootBridgeRequestError, NativeRootBridgeRequestKind, NativeRootBridgeRequestRecord,
        NativeRootBridgeRequestRecorder, NativeRootBridgeRequestSequenceValidator,
        NativeRootBridgeRootHandleState, NativeRootBridgeUnmountRequest,
        smoke_admit_js_native_root_bridge_handoff_records,
    };
    use std::path::Path;

    #[test]
    fn native_boundary_is_a_placeholder() {
        let metadata = boundary_metadata();

        assert_eq!(binding_status(), "placeholder");
        assert_eq!(metadata.package_name(), "@fast-react/native");
        assert_eq!(metadata.native_addon_name(), "fast_react_napi");
        assert_eq!(metadata.node_api_version_floor(), 8);
        assert_eq!(metadata.supported_node_engine_range(), ">=22.0.0");
        assert!(
            metadata
                .platform_artifact_policy()
                .contains("per-platform optional npm packages")
        );
        assert_eq!(metadata.native_target_count(), 8);
    }

    #[test]
    fn native_target_matrix_is_deterministic() {
        let targets = native_target_matrix();

        assert_eq!(targets.len(), 8);
        assert_eq!(targets[0].native_target(), "darwin-arm64");
        assert_eq!(targets[0].platform(), "darwin");
        assert_eq!(targets[0].architecture(), "arm64");
        assert_eq!(targets[0].libc(), None);
        assert_eq!(targets[0].toolchain(), None);
        assert_eq!(
            targets[0].optional_package_name(),
            "@fast-react/native-darwin-arm64"
        );
        assert_eq!(
            targets[0].native_file_name(),
            "fast_react_napi.darwin-arm64.node"
        );

        assert_eq!(targets[1].native_target(), "darwin-x64");
        assert_eq!(
            native_target_metadata("linux-arm64-gnu")
                .expect("linux-arm64-gnu target metadata")
                .optional_package_name(),
            "@fast-react/native-linux-arm64-gnu"
        );
        assert_eq!(
            native_target_metadata("linux-arm64-musl")
                .expect("linux-arm64-musl target metadata")
                .native_file_name(),
            "fast_react_napi.linux-arm64-musl.node"
        );
        assert_eq!(
            native_target_metadata("linux-x64-gnu")
                .expect("linux-x64-gnu target metadata")
                .libc(),
            Some("gnu")
        );
        assert_eq!(
            native_target_metadata("linux-x64-musl")
                .expect("linux-x64-musl target metadata")
                .libc(),
            Some("musl")
        );
        assert_eq!(
            native_target_metadata("win32-arm64-msvc")
                .expect("win32-arm64-msvc target metadata")
                .toolchain(),
            Some("msvc")
        );
        assert_eq!(
            native_target_metadata("win32-x64-msvc")
                .expect("win32-x64-msvc target metadata")
                .optional_package_name(),
            "@fast-react/native-win32-x64-msvc"
        );
        assert!(native_target_metadata("freebsd-x64").is_none());
    }

    #[test]
    fn native_exports_fail_loudly() {
        let error = native_export_placeholder("native.createElement").unwrap_err();
        assert_eq!(error.export_name(), "native.createElement");
        assert_eq!(error.kind(), NativeBoundaryErrorKind::NativeExportsNotBuilt);
        assert_eq!(error.code(), "FAST_REACT_NAPI_EXPORTS_NOT_BUILT");
        assert_eq!(error.source_error_code(), None);
        assert!(error.reason().contains("N-API dependencies"));
        assert!(error.to_string().contains("@fast-react/native"));
        assert!(error.to_string().contains("fast_react_napi"));
    }

    #[test]
    fn native_boundary_unsupported_native_execution_stays_distinct_from_root_validation() {
        let error = native_export_placeholder("native.root.render").unwrap_err();

        assert_eq!(error.kind(), NativeBoundaryErrorKind::NativeExportsNotBuilt);
        assert_eq!(error.code(), "FAST_REACT_NAPI_EXPORTS_NOT_BUILT");
        assert_eq!(error.source_error_code(), None);
        assert!(!error.to_string().contains("FAST_REACT_UNIMPLEMENTED"));
        assert!(!error.to_string().contains("React behavior"));
        assert_ne!(
            error.code(),
            NativeBoundaryErrorKind::RootBridgeWrongEnvironment.code()
        );
        assert_ne!(
            error.code(),
            NativeBoundaryErrorKind::RootBridgeStaleHandle.code()
        );
        assert_ne!(
            error.code(),
            NativeBoundaryErrorKind::RootBridgeWrongLifecycleOrder.code()
        );
    }

    #[test]
    fn native_boundary_errors_are_not_react_behavior_errors() {
        let error = native_export_placeholder("native.processWork").unwrap_err();

        assert!(!error.to_string().contains("React behavior"));
        assert_eq!(error.metadata(), boundary_metadata());
    }

    #[test]
    fn native_root_bridge_boundary_maps_wrong_environment_and_stale_handles() {
        let mut first = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(319));
        let second = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(320));
        let mut first_recorder = NativeRootBridgeRequestRecorder::new();
        let mut second_recorder = NativeRootBridgeRequestRecorder::new();
        let create = first_recorder
            .record_create_root(&mut first, NativeRootBridgeCreateRequest::new(7901))
            .unwrap();

        let wrong_environment = second_recorder
            .record_render(
                &second,
                NativeRootBridgeRenderRequest::new(create.root_handle()),
            )
            .unwrap_err();
        let wrong_environment_boundary =
            native_root_bridge_validation_placeholder("native.root.render", &wrong_environment);

        assert_eq!(
            wrong_environment_boundary.kind(),
            NativeBoundaryErrorKind::RootBridgeWrongEnvironment
        );
        assert_eq!(
            wrong_environment_boundary.code(),
            "FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_ENVIRONMENT"
        );
        assert_eq!(
            wrong_environment_boundary.source_error_code(),
            Some("FAST_REACT_NAPI_WRONG_ENVIRONMENT")
        );
        assert!(
            wrong_environment_boundary
                .reason()
                .contains("wrong bridge environment")
        );
        assert!(
            wrong_environment_boundary
                .to_string()
                .contains("source=FAST_REACT_NAPI_WRONG_ENVIRONMENT")
        );
        assert!(
            !wrong_environment_boundary
                .to_string()
                .contains("React behavior")
        );

        let unmount = first_recorder
            .record_unmount(
                &mut first,
                NativeRootBridgeUnmountRequest::new(create.root_handle()),
            )
            .unwrap();
        let stale = first_recorder
            .record_render(
                &first,
                NativeRootBridgeRenderRequest::new(unmount.root_handle()),
            )
            .unwrap_err();
        let stale_boundary =
            native_root_bridge_validation_placeholder("native.root.render", &stale);

        assert_eq!(
            stale_boundary.kind(),
            NativeBoundaryErrorKind::RootBridgeStaleHandle
        );
        assert_eq!(
            stale_boundary.code(),
            "FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE"
        );
        assert_eq!(
            stale_boundary.source_error_code(),
            Some("FAST_REACT_NAPI_STALE_HANDLE")
        );
        assert!(stale_boundary.reason().contains("stale or retired"));
        assert!(!stale_boundary.to_string().contains("React behavior"));
    }

    #[test]
    fn native_root_bridge_boundary_maps_wrong_lifecycle_order() {
        let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(319));
        let manual_root = table.insert_root(PlaceholderRootRecord::new(7902));
        let mut recorder = NativeRootBridgeRequestRecorder::new();
        let mut validator = NativeRootBridgeRequestSequenceValidator::new();
        let render_before_create = recorder
            .record_render(&table, NativeRootBridgeRenderRequest::new(manual_root))
            .unwrap();

        let missing_create = validator
            .validate_next(&table, render_before_create)
            .unwrap_err();
        let boundary =
            native_root_bridge_validation_placeholder("native.root.render", &missing_create);

        assert_eq!(
            boundary.kind(),
            NativeBoundaryErrorKind::RootBridgeWrongLifecycleOrder
        );
        assert_eq!(
            boundary.code(),
            "FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER"
        );
        assert_eq!(
            boundary.source_error_code(),
            Some("FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE")
        );
        assert!(boundary.reason().contains("invalid root lifecycle order"));
        assert!(
            boundary
                .to_string()
                .contains("source=FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE")
        );
        assert!(!boundary.to_string().contains("FAST_REACT_UNIMPLEMENTED"));
        assert!(!boundary.to_string().contains("React behavior"));
    }

    #[test]
    fn native_root_bridge_records_create_and_render_inert_handle_metadata() {
        let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(256));
        let container_handle = table.insert_value(PlaceholderValueRecord::new(9001));
        let element_handle = table.insert_value(PlaceholderValueRecord::new(9002));
        let mut recorder = NativeRootBridgeRequestRecorder::new();

        let create = recorder
            .record_create_root(
                &mut table,
                NativeRootBridgeCreateRequest::new(7001).with_container_handle(container_handle),
            )
            .unwrap();

        assert_eq!(create.request_id(), 1);
        assert_eq!(create.kind(), NativeRootBridgeRequestKind::Create);
        assert_eq!(create.kind().code(), "create");
        assert_eq!(create.environment_id(), table.environment_id());
        assert_eq!(create.root_id(), 7001);
        assert_eq!(create.value_handle(), Some(container_handle));
        assert_eq!(
            create.root_handle_state(),
            NativeRootBridgeRootHandleState::Active
        );
        assert_eq!(
            table.get_root(create.root_handle()).unwrap().root_id(),
            7001
        );
        assert_eq!(table.get_value(container_handle).unwrap().value_id(), 9001);

        let render = recorder
            .record_render(
                &table,
                NativeRootBridgeRenderRequest::new(create.root_handle())
                    .with_element_handle(element_handle),
            )
            .unwrap();

        assert_eq!(render.request_id(), 2);
        assert_eq!(render.kind(), NativeRootBridgeRequestKind::Render);
        assert_eq!(render.kind().code(), "render");
        assert_eq!(render.environment_id(), table.environment_id());
        assert_eq!(render.root_handle(), create.root_handle());
        assert_eq!(render.root_id(), 7001);
        assert_eq!(render.value_handle(), Some(element_handle));
        assert_eq!(
            render.root_handle_state(),
            NativeRootBridgeRootHandleState::Active
        );
        assert_eq!(
            table.get_root(render.root_handle()).unwrap().root_id(),
            7001
        );
        assert_eq!(table.get_value(element_handle).unwrap().value_id(), 9002);
    }

    #[test]
    fn native_root_bridge_unmount_record_retires_root_without_touching_values() {
        let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(256));
        let container_handle = table.insert_value(PlaceholderValueRecord::new(9101));
        let element_handle = table.insert_value(PlaceholderValueRecord::new(9102));
        let mut recorder = NativeRootBridgeRequestRecorder::new();
        let create = recorder
            .record_create_root(
                &mut table,
                NativeRootBridgeCreateRequest::new(7101).with_container_handle(container_handle),
            )
            .unwrap();

        recorder
            .record_render(
                &table,
                NativeRootBridgeRenderRequest::new(create.root_handle())
                    .with_element_handle(element_handle),
            )
            .unwrap();
        let unmount = recorder
            .record_unmount(
                &mut table,
                NativeRootBridgeUnmountRequest::new(create.root_handle()),
            )
            .unwrap();

        assert_eq!(unmount.request_id(), 3);
        assert_eq!(unmount.kind(), NativeRootBridgeRequestKind::Unmount);
        assert_eq!(unmount.kind().code(), "unmount");
        assert_eq!(unmount.root_id(), 7101);
        assert_eq!(unmount.root_handle(), create.root_handle());
        assert_eq!(unmount.value_handle(), None);
        assert_eq!(
            unmount.root_handle_state(),
            NativeRootBridgeRootHandleState::Retired
        );
        assert_eq!(
            table.get_root(create.root_handle()).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle: create.root_handle(),
                current_generation: create.root_handle().generation() + 1,
            }
        );
        assert_eq!(table.get_value(container_handle).unwrap().value_id(), 9101);
        assert_eq!(table.get_value(element_handle).unwrap().value_id(), 9102);
    }

    #[test]
    fn native_root_bridge_records_reject_wrong_environment_stale_and_wrong_kind_handles() {
        let mut first = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(256));
        let second = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(257));
        let wrong_kind_handle = first.insert_value(PlaceholderValueRecord::new(9201));
        let mut first_recorder = NativeRootBridgeRequestRecorder::new();
        let mut second_recorder = NativeRootBridgeRequestRecorder::new();
        let create = first_recorder
            .record_create_root(&mut first, NativeRootBridgeCreateRequest::new(7201))
            .unwrap();

        let wrong_environment = second_recorder
            .record_render(
                &second,
                NativeRootBridgeRenderRequest::new(create.root_handle()),
            )
            .unwrap_err();

        assert_eq!(
            wrong_environment,
            NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::WrongEnvironment {
                handle: create.root_handle(),
                expected: second.environment_id()
            })
        );
        assert_eq!(
            wrong_environment.code(),
            "FAST_REACT_NAPI_WRONG_ENVIRONMENT"
        );

        let wrong_kind = first_recorder
            .record_render(
                &first,
                NativeRootBridgeRenderRequest::new(wrong_kind_handle),
            )
            .unwrap_err();

        assert_eq!(
            wrong_kind,
            NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::WrongKind {
                handle: wrong_kind_handle,
                expected: BridgeHandleKind::Root,
                actual: BridgeHandleKind::Value
            })
        );
        assert_eq!(wrong_kind.code(), "FAST_REACT_NAPI_WRONG_HANDLE_KIND");

        let unmount = first_recorder
            .record_unmount(
                &mut first,
                NativeRootBridgeUnmountRequest::new(create.root_handle()),
            )
            .unwrap();
        let stale = first_recorder
            .record_render(
                &first,
                NativeRootBridgeRenderRequest::new(unmount.root_handle()),
            )
            .unwrap_err();

        assert_eq!(
            stale,
            NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
                handle: create.root_handle(),
                current_generation: create.root_handle().generation() + 1
            })
        );
        assert_eq!(stale.code(), "FAST_REACT_NAPI_STALE_HANDLE");
    }

    #[test]
    fn native_root_bridge_records_preserve_environment_teardown_stale_guarantee() {
        let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(256));
        let element_handle = table.insert_value(PlaceholderValueRecord::new(9301));
        let mut recorder = NativeRootBridgeRequestRecorder::new();
        let create = recorder
            .record_create_root(&mut table, NativeRootBridgeCreateRequest::new(7301))
            .unwrap();
        let teardown = table.teardown_environment(table.environment_id());

        assert!(teardown.environment_matched());
        assert_eq!(teardown.root_handles_invalidated(), 1);
        assert_eq!(teardown.value_handles_invalidated(), 1);

        let stale_root = recorder
            .record_render(
                &table,
                NativeRootBridgeRenderRequest::new(create.root_handle())
                    .with_element_handle(element_handle),
            )
            .unwrap_err();

        assert_eq!(
            stale_root,
            NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
                handle: create.root_handle(),
                current_generation: create.root_handle().generation() + 1
            })
        );
        assert_eq!(
            table.get_value(element_handle).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle: element_handle,
                current_generation: element_handle.generation() + 1
            }
        );
    }

    #[test]
    fn native_root_bridge_sequence_validator_admits_create_render_unmount_against_handle_table() {
        let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(281));
        let container_handle = table.insert_value(PlaceholderValueRecord::new(9401));
        let element_handle = table.insert_value(PlaceholderValueRecord::new(9402));
        let mut recorder = NativeRootBridgeRequestRecorder::new();
        let mut validator = NativeRootBridgeRequestSequenceValidator::new();

        let create = recorder
            .record_create_root(
                &mut table,
                NativeRootBridgeCreateRequest::new(7401).with_container_handle(container_handle),
            )
            .unwrap();
        let create_validation = validator.validate_next(&table, create).unwrap();

        assert_eq!(create_validation.request_id(), create.request_id());
        assert_eq!(
            create_validation.kind(),
            NativeRootBridgeRequestKind::Create
        );
        assert_eq!(create_validation.environment_id(), table.environment_id());
        assert_eq!(create_validation.root_handle(), create.root_handle());
        assert_eq!(create_validation.root_id(), 7401);
        assert_eq!(create_validation.value_handle(), Some(container_handle));
        assert_eq!(
            create_validation.root_handle_state(),
            NativeRootBridgeRootHandleState::Active
        );
        assert_eq!(
            create_validation.lifecycle_transition(),
            NativeRootBridgeLifecycleTransition::NoneToActive
        );
        assert_eq!(
            create_validation.lifecycle_transition().code(),
            "none->active"
        );
        assert!(create_validation.root_handle_validated());
        assert!(create_validation.value_handle_validated());
        assert_eq!(validator.root_handle(), Some(create.root_handle()));
        assert_eq!(validator.root_id(), Some(7401));
        assert_eq!(validator.last_request_id(), Some(create.request_id()));
        assert!(!validator.root_retired());

        let render = recorder
            .record_render(
                &table,
                NativeRootBridgeRenderRequest::new(create.root_handle())
                    .with_element_handle(element_handle),
            )
            .unwrap();
        let render_validation = validator.validate_next(&table, render).unwrap();

        assert_eq!(render_validation.request_id(), render.request_id());
        assert_eq!(
            render_validation.kind(),
            NativeRootBridgeRequestKind::Render
        );
        assert_eq!(render_validation.value_handle(), Some(element_handle));
        assert_eq!(
            render_validation.lifecycle_transition(),
            NativeRootBridgeLifecycleTransition::ActiveToActive
        );
        assert_eq!(
            render_validation.lifecycle_transition().code(),
            "active->active"
        );
        assert!(render_validation.root_handle_validated());
        assert!(render_validation.value_handle_validated());
        assert_eq!(validator.last_request_id(), Some(render.request_id()));
        assert!(!validator.root_retired());

        let unmount = recorder
            .record_unmount(
                &mut table,
                NativeRootBridgeUnmountRequest::new(create.root_handle()),
            )
            .unwrap();
        let unmount_validation = validator.validate_next(&table, unmount).unwrap();

        assert_eq!(
            unmount_validation.kind(),
            NativeRootBridgeRequestKind::Unmount
        );
        assert_eq!(unmount_validation.root_handle(), create.root_handle());
        assert_eq!(unmount_validation.value_handle(), None);
        assert_eq!(
            unmount_validation.root_handle_state(),
            NativeRootBridgeRootHandleState::Retired
        );
        assert_eq!(
            unmount_validation.lifecycle_transition(),
            NativeRootBridgeLifecycleTransition::ActiveToRetired
        );
        assert_eq!(
            unmount_validation.lifecycle_transition().code(),
            "active->retired"
        );
        assert!(unmount_validation.root_handle_validated());
        assert!(!unmount_validation.value_handle_validated());
        assert_eq!(validator.last_request_id(), Some(unmount.request_id()));
        assert!(validator.root_retired());
        assert_eq!(
            table.get_root(create.root_handle()).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle: create.root_handle(),
                current_generation: create.root_handle().generation() + 1
            }
        );
    }

    #[test]
    fn native_root_bridge_js_handoff_records_smoke_admit_through_rust_handle_table() {
        let environment_id = BridgeEnvironmentId::from_raw(376);
        let root_handle = BridgeHandle::new(environment_id, 1, 1, BridgeHandleKind::Root);
        let container_handle = BridgeHandle::new(environment_id, 2, 1, BridgeHandleKind::Value);
        let element_handle = BridgeHandle::new(environment_id, 3, 1, BridgeHandleKind::Value);
        let requests = [
            NativeRootBridgeRequestRecord::from_js_native_handoff_record(
                1,
                NativeRootBridgeRequestKind::Create,
                environment_id,
                root_handle,
                1,
                Some(container_handle),
                NativeRootBridgeRootHandleState::Active,
            ),
            NativeRootBridgeRequestRecord::from_js_native_handoff_record(
                2,
                NativeRootBridgeRequestKind::Render,
                environment_id,
                root_handle,
                1,
                Some(element_handle),
                NativeRootBridgeRootHandleState::Active,
            ),
            NativeRootBridgeRequestRecord::from_js_native_handoff_record(
                3,
                NativeRootBridgeRequestKind::Unmount,
                environment_id,
                root_handle,
                1,
                None,
                NativeRootBridgeRootHandleState::Retired,
            ),
        ];

        let smoke = smoke_admit_js_native_root_bridge_handoff_records(&requests).unwrap();
        let admission_records = smoke.admission_records();
        let validation_records = smoke.validation_records();

        assert_eq!(smoke.environment_id(), environment_id);
        assert_eq!(smoke.root_handle(), Some(root_handle));
        assert_eq!(smoke.root_id(), Some(1));
        assert!(smoke.root_retired());
        assert_eq!(admission_records.len(), 3);
        assert_eq!(validation_records.len(), 3);
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.request_id())
                .collect::<Vec<_>>(),
            [1, 2, 3]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.kind().code())
                .collect::<Vec<_>>(),
            ["create", "render", "unmount"]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.lifecycle_transition().code())
                .collect::<Vec<_>>(),
            ["none->active", "active->active", "active->retired"]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.root_handle_state_before().map(|state| state.code()))
                .collect::<Vec<_>>(),
            [None, Some("active"), Some("active")]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.root_handle_state_after().code())
                .collect::<Vec<_>>(),
            ["active", "active", "retired"]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.root_handle_action().code())
                .collect::<Vec<_>>(),
            [
                NativeRootBridgeHandleAdmissionAction::AdmitRootHandle.code(),
                NativeRootBridgeHandleAdmissionAction::ValidateActiveRootHandle.code(),
                NativeRootBridgeHandleAdmissionAction::RetireRootHandle.code()
            ]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.root_handle_current_generation())
                .collect::<Vec<_>>(),
            [1, 1, 2]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.value_handle_action().map(|action| action.code()))
                .collect::<Vec<_>>(),
            [
                Some(NativeRootBridgeHandleAdmissionAction::AdmitValueHandle.code()),
                Some(NativeRootBridgeHandleAdmissionAction::AdmitValueHandle.code()),
                None
            ]
        );
        assert_eq!(
            admission_records
                .iter()
                .map(|record| record.value_handle_current_generation())
                .collect::<Vec<_>>(),
            [Some(1), Some(1), None]
        );
        assert_eq!(
            admission_records[2].retired_root_source_error_code(),
            Some("FAST_REACT_NAPI_STALE_HANDLE")
        );
        assert_eq!(
            validation_records
                .iter()
                .map(|record| record.lifecycle_transition().code())
                .collect::<Vec<_>>(),
            ["none->active", "active->active", "active->retired"]
        );
        assert_eq!(
            validation_records
                .iter()
                .map(|record| record.root_handle_state().code())
                .collect::<Vec<_>>(),
            ["active", "active", "retired"]
        );
        assert_eq!(validation_records[0].value_handle(), Some(container_handle));
        assert_eq!(validation_records[1].value_handle(), Some(element_handle));
        assert_eq!(validation_records[2].value_handle(), None);
        assert!(validation_records[0].value_handle_validated());
        assert!(validation_records[1].value_handle_validated());
        assert!(!validation_records[2].value_handle_validated());
    }

    #[test]
    fn native_root_bridge_js_request_shape_metadata_matches_handle_validation_model() {
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JS_REQUEST_SHAPE_GATE_STATUS,
            "admitted-native-root-bridge-js-request-shape"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_HANDLE_ADMISSION_PREFLIGHT_STATUS,
            "preflighted-native-root-bridge-real-handle-admission"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_RUST_HANDLE_TABLE_ADMISSION_SMOKE_STATUS,
            "mirrored-native-root-bridge-rust-handle-table-admission-smoke"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_REQUEST_VALIDATION_MODEL,
            "fast-react-napi.NativeRootBridgeRequestSequenceValidator"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_HANDLE_TABLE_MODEL,
            "fast-react-napi.BridgeHandleTable"
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JS_REQUEST_RECORD_FIELDS,
            &[
                "requestId",
                "kind",
                "environmentId",
                "rootHandle",
                "rootId",
                "valueHandle",
                "rootHandleState"
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_RUST_REQUEST_RECORD_FIELDS,
            &[
                "request_id",
                "kind",
                "environment_id",
                "root_handle",
                "root_id",
                "value_handle",
                "root_handle_state"
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_RUST_VALIDATION_RECORD_FIELDS,
            &[
                "request_id",
                "kind",
                "environment_id",
                "root_handle",
                "root_id",
                "value_handle",
                "root_handle_state",
                "lifecycle_transition",
                "root_handle_validated",
                "value_handle_validated"
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_JS_HANDLE_FIELDS,
            &["environmentId", "slot", "generation", "kind"]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_RUST_HANDLE_FIELDS,
            &["environment_id", "slot", "generation", "kind"]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_REQUEST_KIND_CODES,
            &[
                NativeRootBridgeRequestKind::Create.code(),
                NativeRootBridgeRequestKind::Render.code(),
                NativeRootBridgeRequestKind::Unmount.code()
            ]
        );
        assert_eq!(NATIVE_ROOT_BRIDGE_HANDLE_KIND_CODES, &["root", "value"]);
        assert_eq!(BridgeHandleKind::Root.to_string(), "root");
        assert_eq!(BridgeHandleKind::Value.to_string(), "value");
        assert_eq!(
            NATIVE_ROOT_BRIDGE_ROOT_HANDLE_STATE_CODES,
            &[
                NativeRootBridgeRootHandleState::Active.code(),
                NativeRootBridgeRootHandleState::Retired.code()
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_LIFECYCLE_TRANSITION_CODES,
            &[
                NativeRootBridgeLifecycleTransition::NoneToActive.code(),
                NativeRootBridgeLifecycleTransition::ActiveToActive.code(),
                NativeRootBridgeLifecycleTransition::ActiveToRetired.code()
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_HANDLE_ADMISSION_ACTION_CODES,
            &[
                NativeRootBridgeHandleAdmissionAction::AdmitRootHandle.code(),
                NativeRootBridgeHandleAdmissionAction::AdmitValueHandle.code(),
                NativeRootBridgeHandleAdmissionAction::ValidateActiveRootHandle.code(),
                NativeRootBridgeHandleAdmissionAction::ValidateValueHandle.code(),
                NativeRootBridgeHandleAdmissionAction::RetireRootHandle.code(),
                NativeRootBridgeHandleAdmissionAction::ValidateRetiredRootHandle.code()
            ]
        );
        assert_eq!(
            NATIVE_ROOT_BRIDGE_RUST_HANDLE_TABLE_ADMISSION_SMOKE_RECORD_FIELDS,
            &[
                "request_id",
                "kind",
                "lifecycle_transition",
                "root_handle_state_before",
                "root_handle_state_after",
                "root_handle_action",
                "root_handle_current_generation",
                "value_handle_action",
                "value_handle_current_generation",
                "retired_root_source_error_code"
            ]
        );
    }

    #[test]
    fn native_root_bridge_sequence_validator_rejects_value_handles_invalidated_after_recording() {
        let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(281));
        let element_handle = table.insert_value(PlaceholderValueRecord::new(9501));
        let mut recorder = NativeRootBridgeRequestRecorder::new();
        let mut validator = NativeRootBridgeRequestSequenceValidator::new();
        let create = recorder
            .record_create_root(&mut table, NativeRootBridgeCreateRequest::new(7501))
            .unwrap();

        validator.validate_next(&table, create).unwrap();
        let render = recorder
            .record_render(
                &table,
                NativeRootBridgeRenderRequest::new(create.root_handle())
                    .with_element_handle(element_handle),
            )
            .unwrap();
        table.remove_value(element_handle).unwrap();

        let stale_value = validator.validate_next(&table, render).unwrap_err();

        assert_eq!(
            stale_value,
            NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
                handle: element_handle,
                current_generation: element_handle.generation() + 1
            })
        );
        assert_eq!(stale_value.code(), "FAST_REACT_NAPI_STALE_HANDLE");
        assert_eq!(validator.last_request_id(), Some(create.request_id()));
        assert!(!validator.root_retired());
    }

    #[test]
    fn native_root_bridge_sequence_validator_rejects_wrong_environment_records() {
        let mut first = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(281));
        let second = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(282));
        let mut recorder = NativeRootBridgeRequestRecorder::new();
        let mut validator = NativeRootBridgeRequestSequenceValidator::new();
        let create = recorder
            .record_create_root(&mut first, NativeRootBridgeCreateRequest::new(7601))
            .unwrap();

        let wrong_environment = validator.validate_next(&second, create).unwrap_err();

        assert_eq!(
            wrong_environment,
            NativeRootBridgeRequestError::RecordEnvironmentMismatch {
                record_environment_id: first.environment_id(),
                table_environment_id: second.environment_id()
            }
        );
        assert_eq!(
            wrong_environment.code(),
            "FAST_REACT_NAPI_ROOT_REQUEST_RECORD_ENVIRONMENT_MISMATCH"
        );
        assert_eq!(validator.last_request_id(), None);
        assert_eq!(
            first.get_root(create.root_handle()).unwrap().root_id(),
            7601
        );
    }

    #[test]
    fn native_root_bridge_sequence_validator_rejects_invalid_lifecycle_order() {
        let mut table = BridgeHandleTable::new(BridgeEnvironmentId::from_raw(281));
        let manual_root = table.insert_root(PlaceholderRootRecord::new(7701));
        let mut recorder = NativeRootBridgeRequestRecorder::new();
        let mut validator = NativeRootBridgeRequestSequenceValidator::new();
        let render_before_create = recorder
            .record_render(&table, NativeRootBridgeRenderRequest::new(manual_root))
            .unwrap();

        let missing_create = validator
            .validate_next(&table, render_before_create)
            .unwrap_err();

        assert_eq!(
            missing_create,
            NativeRootBridgeRequestError::SequenceMustStartWithCreate {
                actual: NativeRootBridgeRequestKind::Render
            }
        );
        assert_eq!(
            missing_create.code(),
            "FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE"
        );

        let create = recorder
            .record_create_root(&mut table, NativeRootBridgeCreateRequest::new(7702))
            .unwrap();
        validator.validate_next(&table, create).unwrap();

        let out_of_order = validator
            .validate_next(&table, render_before_create)
            .unwrap_err();

        assert_eq!(
            out_of_order,
            NativeRootBridgeRequestError::RequestSequenceOutOfOrder {
                previous_request_id: create.request_id(),
                request_id: render_before_create.request_id()
            }
        );

        let foreign_root = table.insert_root(PlaceholderRootRecord::new(7703));
        let foreign_render = recorder
            .record_render(&table, NativeRootBridgeRenderRequest::new(foreign_root))
            .unwrap();
        let handle_mismatch = validator.validate_next(&table, foreign_render).unwrap_err();

        assert_eq!(
            handle_mismatch,
            NativeRootBridgeRequestError::RecordRootHandleMismatch {
                expected: create.root_handle(),
                actual: foreign_root
            }
        );
        assert_eq!(
            handle_mismatch.code(),
            "FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_MISMATCH"
        );

        let unmount = recorder
            .record_unmount(
                &mut table,
                NativeRootBridgeUnmountRequest::new(create.root_handle()),
            )
            .unwrap();
        validator.validate_next(&table, unmount).unwrap();
        let create_after_unmount = recorder
            .record_create_root(&mut table, NativeRootBridgeCreateRequest::new(7704))
            .unwrap();
        let after_unmount = validator
            .validate_next(&table, create_after_unmount)
            .unwrap_err();

        assert_eq!(
            after_unmount,
            NativeRootBridgeRequestError::RequestAfterUnmount {
                request_id: create_after_unmount.request_id()
            }
        );
        assert_eq!(
            after_unmount.code(),
            "FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT"
        );
    }

    #[test]
    fn crate_manifest_has_no_real_native_binding_or_build_dependency() {
        let manifest = include_str!("../Cargo.toml");
        let dependency_names = dependency_names_from_manifest(manifest);
        let forbidden_dependencies = [
            "napi",
            "napi-derive",
            "napi-build",
            "neon",
            "node-sys",
            "v8",
            "rusty_v8",
            "libuv",
            "uv-sys",
        ];

        for dependency_name in dependency_names {
            assert!(
                !forbidden_dependencies.contains(&dependency_name),
                "{dependency_name} would make the placeholder depend on native Node/V8/libuv binding APIs"
            );
        }

        assert!(
            !manifest
                .lines()
                .any(|line| line.trim_start().starts_with("build =")),
            "the placeholder crate must not run a Cargo build script"
        );
        assert!(
            !Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("build.rs")
                .exists(),
            "the placeholder crate must not add build.rs while no N-API binding exists"
        );
    }

    fn dependency_names_from_manifest(manifest: &str) -> Vec<&str> {
        let mut names = Vec::new();
        let mut in_dependency_section = false;

        for line in manifest.lines() {
            let trimmed = line.trim();

            if trimmed.starts_with('[') {
                in_dependency_section = trimmed == "[dependencies]"
                    || trimmed == "[dev-dependencies]"
                    || trimmed == "[build-dependencies]"
                    || trimmed.starts_with("[target.")
                        && (trimmed.ends_with(".dependencies]")
                            || trimmed.ends_with(".dev-dependencies]")
                            || trimmed.ends_with(".build-dependencies]"));

                if let Some(rest) = trimmed.strip_prefix("[dependencies.") {
                    names.push(rest.trim_end_matches(']'));
                }
                if let Some(rest) = trimmed.strip_prefix("[dev-dependencies.") {
                    names.push(rest.trim_end_matches(']'));
                }
                if let Some(rest) = trimmed.strip_prefix("[build-dependencies.") {
                    names.push(rest.trim_end_matches(']'));
                }

                continue;
            }

            if !in_dependency_section || trimmed.is_empty() || trimmed.starts_with('#') {
                continue;
            }

            if let Some((name, _value)) = trimmed.split_once('=') {
                names.push(name.trim().trim_matches('"'));
            }
        }

        names
    }
}
