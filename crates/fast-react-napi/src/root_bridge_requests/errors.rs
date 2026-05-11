    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeJsonTransportValueKind {
        Null,
        Boolean,
        Number,
        String,
        Array,
        Object,
    }

    impl NativeRootBridgeJsonTransportValueKind {
        #[must_use]
        pub(crate) const fn code(self) -> &'static str {
            match self {
                Self::Null => "null",
                Self::Boolean => "boolean",
                Self::Number => "number",
                Self::String => "string",
                Self::Array => "array",
                Self::Object => "object",
            }
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
        ReusedValueHandle {
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
        ExecutorGenerationExhausted,
        JsonTransportRecordInvalid {
            field: &'static str,
            value: &'static str,
        },
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
                Self::ReusedValueHandle { .. } => "FAST_REACT_NAPI_ROOT_REQUEST_VALUE_HANDLE_REUSE",
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
                Self::ExecutorGenerationExhausted => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_EXECUTOR_GENERATION_EXHAUSTED"
                }
                Self::JsonTransportRecordInvalid { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_RECORD_INVALID"
                }
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
                Self::ReusedValueHandle { value_handle } => write!(
                    formatter,
                    "native root bridge value handle slot {} generation {} was already consumed by this executor",
                    value_handle.slot(),
                    value_handle.generation()
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
                Self::ExecutorGenerationExhausted => formatter.write_str(
                    "native root bridge JSON lifecycle executor cannot allocate another generation",
                ),
                Self::JsonTransportRecordInvalid { field, value } => write!(
                    formatter,
                    "native root bridge JSON transport record has unsupported {field} value {value}"
                ),
            }
        }
    }

    impl Error for NativeRootBridgeRequestError {}

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) enum NativeRootBridgeJsonTransportParseError {
        InvalidJson {
            line: usize,
            column: usize,
        },
        ExpectedObject {
            path: String,
            actual: NativeRootBridgeJsonTransportValueKind,
        },
        MissingField {
            path: String,
            field: &'static str,
        },
        UnexpectedField {
            path: String,
            field: String,
        },
        InvalidFieldType {
            path: String,
            expected: &'static str,
            actual: NativeRootBridgeJsonTransportValueKind,
        },
        UnsupportedFieldValue {
            path: String,
            expected: &'static str,
            actual: String,
        },
        Validation(NativeRootBridgeRequestError),
    }

    impl NativeRootBridgeJsonTransportParseError {
        #[must_use]
        pub(crate) const fn code(&self) -> &'static str {
            match self {
                Self::InvalidJson { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_JSON"
                }
                Self::ExpectedObject { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_EXPECTED_OBJECT"
                }
                Self::MissingField { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_MISSING_FIELD"
                }
                Self::UnexpectedField { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNEXPECTED_FIELD"
                }
                Self::InvalidFieldType { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_FIELD_TYPE"
                }
                Self::UnsupportedFieldValue { .. } => {
                    "FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNSUPPORTED_FIELD_VALUE"
                }
                Self::Validation(error) => error.code(),
            }
        }

        #[must_use]
        pub(crate) const fn source_error_code(&self) -> Option<&'static str> {
            match self {
                Self::Validation(error) => Some(error.code()),
                _ => None,
            }
        }
    }

    impl Display for NativeRootBridgeJsonTransportParseError {
        fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
            match self {
                Self::InvalidJson { line, column } => write!(
                    formatter,
                    "native root bridge JSON transport payload is invalid JSON at line {line}, column {column}"
                ),
                Self::ExpectedObject { path, actual } => write!(
                    formatter,
                    "native root bridge JSON transport expected object at {path}, got {}",
                    actual.code()
                ),
                Self::MissingField { path, field } => write!(
                    formatter,
                    "native root bridge JSON transport object at {path} is missing required field {field}"
                ),
                Self::UnexpectedField { path, field } => write!(
                    formatter,
                    "native root bridge JSON transport object at {path} has unexpected field {field}"
                ),
                Self::InvalidFieldType {
                    path,
                    expected,
                    actual,
                } => write!(
                    formatter,
                    "native root bridge JSON transport field {path} expected {expected}, got {}",
                    actual.code()
                ),
                Self::UnsupportedFieldValue {
                    path,
                    expected,
                    actual,
                } => write!(
                    formatter,
                    "native root bridge JSON transport field {path} has unsupported value {actual}, expected {expected}"
                ),
                Self::Validation(error) => write!(
                    formatter,
                    "native root bridge JSON transport failed validation: {error}"
                ),
            }
        }
    }

    impl Error for NativeRootBridgeJsonTransportParseError {
        fn source(&self) -> Option<&(dyn Error + 'static)> {
            match self {
                Self::Validation(error) => Some(error),
                _ => None,
            }
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct NativeRootBridgeJsonTransportDiagnosticCase {
        id: &'static str,
        category: &'static str,
        phase: &'static str,
        json: &'static str,
        boundary_error_code: Option<&'static str>,
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub(crate) struct NativeRootBridgeJsonTransportErrorDiagnosticRow {
        id: &'static str,
        category: &'static str,
        phase: &'static str,
        code: &'static str,
        source_error_code: Option<&'static str>,
        boundary_error_code: Option<&'static str>,
        native_addon_loaded: bool,
        native_execution: bool,
        renderer_execution: bool,
        reconciler_execution: bool,
        react_behavior_error: bool,
    }

    impl NativeRootBridgeJsonTransportErrorDiagnosticRow {
        const fn from_parse_error(
            case: NativeRootBridgeJsonTransportDiagnosticCase,
            error: &NativeRootBridgeJsonTransportParseError,
        ) -> Self {
            Self {
                id: case.id,
                category: case.category,
                phase: case.phase,
                code: error.code(),
                source_error_code: error.source_error_code(),
                boundary_error_code: case.boundary_error_code,
                native_addon_loaded: false,
                native_execution: false,
                renderer_execution: false,
                reconciler_execution: false,
                react_behavior_error: false,
            }
        }

        #[must_use]
        pub(crate) const fn id(&self) -> &'static str {
            self.id
        }

        #[must_use]
        pub(crate) const fn category(&self) -> &'static str {
            self.category
        }

        #[must_use]
        pub(crate) const fn phase(&self) -> &'static str {
            self.phase
        }

        #[must_use]
        pub(crate) const fn code(&self) -> &'static str {
            self.code
        }

        #[must_use]
        pub(crate) const fn source_error_code(&self) -> Option<&'static str> {
            self.source_error_code
        }

        #[must_use]
        pub(crate) const fn boundary_error_code(&self) -> Option<&'static str> {
            self.boundary_error_code
        }

        #[must_use]
        pub(crate) const fn native_addon_loaded(&self) -> bool {
            self.native_addon_loaded
        }

        #[must_use]
        pub(crate) const fn native_execution(&self) -> bool {
            self.native_execution
        }

        #[must_use]
        pub(crate) const fn renderer_execution(&self) -> bool {
            self.renderer_execution
        }

        #[must_use]
        pub(crate) const fn reconciler_execution(&self) -> bool {
            self.reconciler_execution
        }

        #[must_use]
        pub(crate) const fn react_behavior_error(&self) -> bool {
            self.react_behavior_error
        }
    }

