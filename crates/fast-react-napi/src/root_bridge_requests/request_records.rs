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

    #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
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

    #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
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
    pub(crate) struct NativeRootBridgeJsonTransportHandle {
        environment_id: u64,
        slot: u64,
        generation: u64,
        kind: &'static str,
    }

    impl NativeRootBridgeJsonTransportHandle {
        #[must_use]
        pub(crate) const fn new(
            environment_id: u64,
            slot: u64,
            generation: u64,
            kind: &'static str,
        ) -> Self {
            Self {
                environment_id,
                slot,
                generation,
                kind,
            }
        }

        fn decode(self, field: &'static str) -> Result<BridgeHandle, NativeRootBridgeRequestError> {
            Ok(BridgeHandle::new(
                BridgeEnvironmentId::from_raw(self.environment_id),
                self.slot,
                self.generation,
                decode_json_transport_handle_kind(field, self.kind)?,
            ))
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeJsonTransportRecord {
        request_id: u64,
        kind: &'static str,
        environment_id: u64,
        root_handle: NativeRootBridgeJsonTransportHandle,
        root_id: u64,
        value_handle: Option<NativeRootBridgeJsonTransportHandle>,
        root_handle_state: &'static str,
    }

    impl NativeRootBridgeJsonTransportRecord {
        #[allow(clippy::too_many_arguments)]
        #[must_use]
        pub(crate) const fn new(
            request_id: u64,
            kind: &'static str,
            environment_id: u64,
            root_handle: NativeRootBridgeJsonTransportHandle,
            root_id: u64,
            value_handle: Option<NativeRootBridgeJsonTransportHandle>,
            root_handle_state: &'static str,
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

        fn decode(self) -> Result<NativeRootBridgeRequestRecord, NativeRootBridgeRequestError> {
            Ok(
                NativeRootBridgeRequestRecord::from_js_native_handoff_record(
                    self.request_id,
                    decode_json_transport_request_kind("kind", self.kind)?,
                    BridgeEnvironmentId::from_raw(self.environment_id),
                    self.root_handle.decode("root_handle.kind")?,
                    self.root_id,
                    self.value_handle
                        .map(|handle| handle.decode("value_handle.kind"))
                        .transpose()?,
                    decode_json_transport_root_handle_state(
                        "root_handle_state",
                        self.root_handle_state,
                    )?,
                ),
            )
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
        AdmitRoot,
        AdmitValue,
        ValidateActiveRoot,
        ValidateValue,
        RetireRoot,
        ValidateRetiredRoot,
    }

    impl NativeRootBridgeHandleAdmissionAction {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::AdmitRoot => "admit-root-handle",
                Self::AdmitValue => "admit-value-handle",
                Self::ValidateActiveRoot => "validate-active-root-handle",
                Self::ValidateValue => "validate-value-handle",
                Self::RetireRoot => "retire-root-handle",
                Self::ValidateRetiredRoot => "validate-retired-root-handle",
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeHandleTableAdmissionSmokeRecord {
        request_id: u64,
        kind: NativeRootBridgeRequestKind,
        source_environment_id: BridgeEnvironmentId,
        source_root_handle: BridgeHandle,
        source_root_id: u64,
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
                source_environment_id: request.environment_id(),
                source_root_handle: request.root_handle(),
                source_root_id: request.root_id(),
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
        pub(crate) const fn source_environment_id(self) -> BridgeEnvironmentId {
            self.source_environment_id
        }

        #[must_use]
        pub(crate) const fn source_root_handle(self) -> BridgeHandle {
            self.source_root_handle
        }

        #[must_use]
        pub(crate) const fn source_root_id(self) -> u64 {
            self.source_root_id
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

        #[cfg(test)]
        pub(crate) const fn with_source_root_id_for_test(mut self, root_id: u64) -> Self {
            self.source_root_id = root_id;
            self
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

