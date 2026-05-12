use std::fmt::{self, Display, Formatter};

use fast_react_core::{FiberId, PropsHandle, StateNodeHandle};

use crate::FiberRootId;
use crate::complete_work::{
    HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    HostComponentDangerousHtmlTextResetPayloadKindForCanary,
};
use crate::host_nodes::{HostNodeMetadata, HostNodeUpdateCurrentness};

pub(super) const TEST_HOST_SAFE_PROPERTY_PROP_NAME: &str = "testHostProperty";
pub(super) const TEST_HOST_SAFE_PROPERTY_NAME: &str = "testHostProperty";
pub(super) const TEST_HOST_STYLE_PROP_NAME: &str = "style";
pub(super) const TEST_HOST_DANGEROUS_HTML_PROP_NAME: &str = "dangerouslySetInnerHTML";
pub(super) const TEST_HOST_DANGEROUS_HTML_PROPERTY_NAME: &str = "innerHTML";
pub(super) const TEST_HOST_TEXT_CONTENT_PROP_NAME: &str = "children";
pub(super) const TEST_HOST_TEXT_CONTENT_PROPERTY_NAME: &str = "textContent";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestHostComponentPropertyPayloadKind {
    SafeTestProperty,
    Style,
    DangerousHtml,
    TextContent,
}

impl TestHostComponentPropertyPayloadKind {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::SafeTestProperty => "safe-test-property",
            Self::Style => "style",
            Self::DangerousHtml => "dangerous-html",
            Self::TextContent => "text-content",
        }
    }

    #[must_use]
    pub(super) const fn is_supported_for_private_execution(self) -> bool {
        matches!(
            self,
            Self::SafeTestProperty | Self::Style | Self::DangerousHtml | Self::TextContent
        )
    }

    #[must_use]
    pub(super) const fn affects_text_content(self) -> bool {
        matches!(self, Self::TextContent)
    }
}

impl Display for TestHostComponentPropertyPayloadKind {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct TestHostComponentPropertyPayloadRow {
    kind: TestHostComponentPropertyPayloadKind,
    prop_name: &'static str,
    property_name: &'static str,
    old_props: PropsHandle,
    new_props: PropsHandle,
}

impl TestHostComponentPropertyPayloadRow {
    #[must_use]
    pub(super) const fn safe_test_property(old_props: PropsHandle, new_props: PropsHandle) -> Self {
        Self {
            kind: TestHostComponentPropertyPayloadKind::SafeTestProperty,
            prop_name: TEST_HOST_SAFE_PROPERTY_PROP_NAME,
            property_name: TEST_HOST_SAFE_PROPERTY_NAME,
            old_props,
            new_props,
        }
    }

    #[must_use]
    pub(super) const fn style(old_props: PropsHandle, new_props: PropsHandle) -> Self {
        Self {
            kind: TestHostComponentPropertyPayloadKind::Style,
            prop_name: TEST_HOST_STYLE_PROP_NAME,
            property_name: TEST_HOST_STYLE_PROP_NAME,
            old_props,
            new_props,
        }
    }

    #[must_use]
    pub(super) const fn dangerous_html(old_props: PropsHandle, new_props: PropsHandle) -> Self {
        Self {
            kind: TestHostComponentPropertyPayloadKind::DangerousHtml,
            prop_name: TEST_HOST_DANGEROUS_HTML_PROP_NAME,
            property_name: TEST_HOST_DANGEROUS_HTML_PROPERTY_NAME,
            old_props,
            new_props,
        }
    }

    #[must_use]
    pub(super) const fn text_content_reset(old_props: PropsHandle, new_props: PropsHandle) -> Self {
        Self {
            kind: TestHostComponentPropertyPayloadKind::TextContent,
            prop_name: TEST_HOST_TEXT_CONTENT_PROP_NAME,
            property_name: TEST_HOST_TEXT_CONTENT_PROPERTY_NAME,
            old_props,
            new_props,
        }
    }

    #[must_use]
    pub(super) fn from_dangerous_html_text_reset_complete_work(
        complete_work: HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    ) -> Self {
        match complete_work.payload_kind() {
            HostComponentDangerousHtmlTextResetPayloadKindForCanary::DangerousHtml => {
                Self::dangerous_html(complete_work.old_props(), complete_work.new_props())
            }
            HostComponentDangerousHtmlTextResetPayloadKindForCanary::TextContentReset => {
                Self::text_content_reset(complete_work.old_props(), complete_work.new_props())
            }
        }
    }

    #[must_use]
    pub(super) const fn kind(self) -> TestHostComponentPropertyPayloadKind {
        self.kind
    }

    #[must_use]
    pub(super) const fn prop_name(self) -> &'static str {
        self.prop_name
    }

    #[must_use]
    pub(super) const fn property_name(self) -> &'static str {
        self.property_name
    }

    #[must_use]
    pub(super) const fn old_props(self) -> PropsHandle {
        self.old_props
    }

    #[must_use]
    pub(super) const fn new_props(self) -> PropsHandle {
        self.new_props
    }

    #[must_use]
    pub(super) const fn public_dom_property_compatibility_claimed(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestHostComponentPropertyPayloadViolation {
    WrongRoot,
    WrongFiber,
    WrongAlternateFiber,
    WrongStateNode,
    WrongPendingProps,
    WrongMemoizedProps,
    WrongAlternateMemoizedProps,
    WrongPayloadRowProps,
    ConflictingTextUpdate,
}

impl TestHostComponentPropertyPayloadViolation {
    #[must_use]
    const fn as_str(self) -> &'static str {
        match self {
            Self::WrongRoot => "payload root does not match the mutation root",
            Self::WrongFiber => "payload fiber does not match the mutation fiber",
            Self::WrongAlternateFiber => {
                "payload current fiber does not match the mutation alternate"
            }
            Self::WrongStateNode => "payload state node does not match the mutation state node",
            Self::WrongPendingProps => "payload new props do not match mutation pending props",
            Self::WrongMemoizedProps => "payload new props do not match mutation memoized props",
            Self::WrongAlternateMemoizedProps => {
                "payload old props do not match mutation alternate memoized props"
            }
            Self::WrongPayloadRowProps => {
                "property payload row props do not match component payload metadata"
            }
            Self::ConflictingTextUpdate => {
                "text-content property row conflicts with a HostText update payload"
            }
        }
    }
}

impl Display for TestHostComponentPropertyPayloadViolation {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostTextCommitExecutionRequestViolation {
    WrongRootToken,
    WrongFinishedWork,
    WrongCommittedCurrent,
    WrongCommitOrder,
    WrongBlockers,
    WrongMutationRoot,
    WrongMutationKind,
    WrongMutationTag,
    MissingCurrent,
    MissingStateNode,
    MissingUpdateFlag,
}

impl HostTextCommitExecutionRequestViolation {
    #[must_use]
    pub(super) const fn as_str(self) -> &'static str {
        match self {
            Self::WrongRootToken => "request root token does not match the root",
            Self::WrongFinishedWork => {
                "request finished work does not match the mutation host root"
            }
            Self::WrongCommittedCurrent => {
                "request committed current does not match the finished work"
            }
            Self::WrongCommitOrder => {
                "request order does not follow source handoff and commit order"
            }
            Self::WrongBlockers => "request public compatibility blockers were tampered",
            Self::WrongMutationRoot => "mutation apply record belongs to another root",
            Self::WrongMutationKind => "mutation apply record is not a HostText update",
            Self::WrongMutationTag => "mutation apply record is not for a HostText fiber",
            Self::MissingCurrent => "mutation apply record is missing the current alternate",
            Self::MissingStateNode => "mutation apply record is missing the text state node",
            Self::MissingUpdateFlag => "mutation apply record is missing the UPDATE effect flag",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct HostComponentUpdatePayload {
    pub(super) root: FiberRootId,
    pub(super) current: FiberId,
    pub(super) work_in_progress: FiberId,
    pub(super) state_node: StateNodeHandle,
    pub(super) old_props: PropsHandle,
    pub(super) new_props: PropsHandle,
    pub(super) ty: &'static str,
    pub(super) property_row: TestHostComponentPropertyPayloadRow,
}

impl HostComponentUpdatePayload {
    #[must_use]
    pub(super) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn current(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub(super) const fn work_in_progress(&self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub(super) const fn state_node(&self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(super) const fn old_props(&self) -> PropsHandle {
        self.old_props
    }

    #[must_use]
    pub(super) const fn new_props(&self) -> PropsHandle {
        self.new_props
    }

    #[must_use]
    pub(super) const fn ty(&self) -> &'static str {
        self.ty
    }

    #[must_use]
    pub(super) const fn property_row(&self) -> TestHostComponentPropertyPayloadRow {
        self.property_row
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct HostTextUpdatePayload {
    pub(super) root: FiberRootId,
    pub(super) current: FiberId,
    pub(super) work_in_progress: FiberId,
    pub(super) state_node: StateNodeHandle,
    pub(super) old_text: String,
    pub(super) new_text: String,
    pub(super) source_currentness: Option<HostNodeUpdateCurrentness>,
}

impl HostTextUpdatePayload {
    #[must_use]
    pub(super) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn current(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub(super) const fn work_in_progress(&self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub(super) const fn state_node(&self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(super) fn old_text(&self) -> &str {
        &self.old_text
    }

    #[must_use]
    pub(super) fn new_text(&self) -> &str {
        &self.new_text
    }

    #[must_use]
    pub(super) const fn source_currentness(&self) -> Option<HostNodeUpdateCurrentness> {
        self.source_currentness
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct HostTextUpdateDiff {
    pub(super) current: FiberId,
    pub(super) work_in_progress: FiberId,
    pub(super) state_node: StateNodeHandle,
    pub(super) metadata: HostNodeMetadata,
    pub(super) old_text: String,
    pub(super) new_text: String,
    pub(super) changed: bool,
}

impl HostTextUpdateDiff {
    #[must_use]
    pub(super) const fn current(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub(super) const fn work_in_progress(&self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub(super) const fn state_node(&self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(super) const fn metadata(&self) -> HostNodeMetadata {
        self.metadata
    }

    #[must_use]
    pub(super) fn old_text(&self) -> &str {
        &self.old_text
    }

    #[must_use]
    pub(super) fn new_text(&self) -> &str {
        &self.new_text
    }

    #[must_use]
    pub(super) const fn changed(&self) -> bool {
        self.changed
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum TestHostRootHostUpdatePayloadForCanary {
    HostComponent {
        current: FiberId,
        work_in_progress: FiberId,
        state_node: StateNodeHandle,
        old_props: PropsHandle,
        new_props: PropsHandle,
        ty: &'static str,
        property_payload_kind: TestHostComponentPropertyPayloadKind,
        prop_name: &'static str,
        property_name: &'static str,
    },
    HostText {
        current: FiberId,
        work_in_progress: FiberId,
        state_node: StateNodeHandle,
        old_text: String,
        new_text: String,
    },
}

impl TestHostRootHostUpdatePayloadForCanary {
    #[must_use]
    pub(super) fn component(payload: HostComponentUpdatePayload) -> Self {
        Self::HostComponent {
            current: payload.current(),
            work_in_progress: payload.work_in_progress(),
            state_node: payload.state_node(),
            old_props: payload.old_props(),
            new_props: payload.new_props(),
            ty: payload.ty(),
            property_payload_kind: payload.property_row().kind(),
            prop_name: payload.property_row().prop_name(),
            property_name: payload.property_row().property_name(),
        }
    }

    #[must_use]
    pub(super) fn text(payload: HostTextUpdatePayload) -> Self {
        Self::HostText {
            current: payload.current(),
            work_in_progress: payload.work_in_progress(),
            state_node: payload.state_node(),
            old_text: payload.old_text().to_owned(),
            new_text: payload.new_text().to_owned(),
        }
    }

    #[must_use]
    pub(crate) const fn current(&self) -> FiberId {
        match self {
            Self::HostComponent { current, .. } | Self::HostText { current, .. } => *current,
        }
    }

    #[must_use]
    pub(crate) const fn work_in_progress(&self) -> FiberId {
        match self {
            Self::HostComponent {
                work_in_progress, ..
            }
            | Self::HostText {
                work_in_progress, ..
            } => *work_in_progress,
        }
    }

    #[must_use]
    pub(crate) const fn state_node(&self) -> StateNodeHandle {
        match self {
            Self::HostComponent { state_node, .. } | Self::HostText { state_node, .. } => {
                *state_node
            }
        }
    }

    #[must_use]
    pub(crate) const fn is_host_component_props_update(&self) -> bool {
        matches!(self, Self::HostComponent { .. })
    }

    #[must_use]
    pub(crate) const fn is_host_text_content_update(&self) -> bool {
        matches!(self, Self::HostText { .. })
    }

    #[must_use]
    pub(crate) fn host_text_old_text(&self) -> Option<&str> {
        match self {
            Self::HostText { old_text, .. } => Some(old_text),
            Self::HostComponent { .. } => None,
        }
    }

    #[must_use]
    pub(crate) fn host_text_new_text(&self) -> Option<&str> {
        match self {
            Self::HostText { new_text, .. } => Some(new_text),
            Self::HostComponent { .. } => None,
        }
    }

    #[must_use]
    pub(crate) const fn host_component_property_payload_kind(
        &self,
    ) -> Option<TestHostComponentPropertyPayloadKind> {
        match self {
            Self::HostComponent {
                property_payload_kind,
                ..
            } => Some(*property_payload_kind),
            Self::HostText { .. } => None,
        }
    }

    #[must_use]
    pub(crate) const fn host_component_prop_name(&self) -> Option<&'static str> {
        match self {
            Self::HostComponent { prop_name, .. } => Some(*prop_name),
            Self::HostText { .. } => None,
        }
    }

    #[must_use]
    pub(crate) const fn host_component_property_name(&self) -> Option<&'static str> {
        match self {
            Self::HostComponent { property_name, .. } => Some(*property_name),
            Self::HostText { .. } => None,
        }
    }
}
