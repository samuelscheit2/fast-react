use super::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostComponentDangerousHtmlTextResetPayloadKindForCanary {
    DangerousHtml,
    TextContentReset,
}

impl HostComponentDangerousHtmlTextResetPayloadKindForCanary {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::DangerousHtml => "dangerous-html",
            Self::TextContentReset => "text-content",
        }
    }

    #[must_use]
    pub(crate) const fn prop_name(self) -> &'static str {
        match self {
            Self::DangerousHtml => "dangerouslySetInnerHTML",
            Self::TextContentReset => "children",
        }
    }

    #[must_use]
    pub(crate) const fn property_name(self) -> &'static str {
        match self {
            Self::DangerousHtml => "innerHTML",
            Self::TextContentReset => "textContent",
        }
    }

    #[must_use]
    pub(crate) const fn expected_private_host_execution(self) -> &'static str {
        match self {
            Self::DangerousHtml => "commit-update",
            Self::TextContentReset => "reset-text-content",
        }
    }

    #[must_use]
    pub(crate) const fn public_dom_property_compatibility_claimed(self) -> bool {
        false
    }
}

impl Display for HostComponentDangerousHtmlTextResetPayloadKindForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary {
    root: FiberRootId,
    current: FiberId,
    work_in_progress: FiberId,
    state_node: StateNodeHandle,
    old_props: PropsHandle,
    new_props: PropsHandle,
    payload_kind: HostComponentDangerousHtmlTextResetPayloadKindForCanary,
    effect_flag: FiberFlags,
}

impl HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn current(self) -> FiberId {
        self.current
    }

    #[must_use]
    pub(crate) const fn work_in_progress(self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub(crate) const fn state_node(self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn old_props(self) -> PropsHandle {
        self.old_props
    }

    #[must_use]
    pub(crate) const fn new_props(self) -> PropsHandle {
        self.new_props
    }

    #[must_use]
    pub(crate) const fn payload_kind(
        self,
    ) -> HostComponentDangerousHtmlTextResetPayloadKindForCanary {
        self.payload_kind
    }

    #[must_use]
    pub(crate) const fn payload_kind_name(self) -> &'static str {
        self.payload_kind.as_str()
    }

    #[must_use]
    pub(crate) const fn prop_name(self) -> &'static str {
        self.payload_kind.prop_name()
    }

    #[must_use]
    pub(crate) const fn property_name(self) -> &'static str {
        self.payload_kind.property_name()
    }

    #[must_use]
    pub(crate) const fn expected_private_host_execution(self) -> &'static str {
        self.payload_kind.expected_private_host_execution()
    }

    #[must_use]
    pub(crate) const fn effect_flag(self) -> FiberFlags {
        self.effect_flag
    }

    #[must_use]
    pub(crate) const fn host_component_update_required(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn private_reconciler_handoff_only(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_root_compatibility_claimed(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn with_new_props_for_canary(mut self, new_props: PropsHandle) -> Self {
        self.new_props = new_props;
        self
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostComponentDangerousHtmlTextResetCompleteWorkErrorForCanary {
    FiberTopology(FiberTopologyError),
    ExpectedHostComponent {
        fiber: FiberId,
        tag: FiberTag,
    },
    MissingCurrent {
        work_in_progress: FiberId,
    },
    CurrentTagMismatch {
        current: FiberId,
        current_tag: FiberTag,
        work_in_progress: FiberId,
        work_in_progress_tag: FiberTag,
    },
    MissingStateNode {
        fiber: FiberId,
    },
    StateNodeMismatch {
        current: FiberId,
        work_in_progress: FiberId,
        current_state_node: StateNodeHandle,
        work_in_progress_state_node: StateNodeHandle,
    },
    MissingUpdateFlag {
        work_in_progress: FiberId,
        flags: FiberFlags,
    },
}

impl Display for HostComponentDangerousHtmlTextResetCompleteWorkErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::ExpectedHostComponent { fiber, tag } => write!(
                formatter,
                "fiber {} must be HostComponent for private dangerousHTML/text reset complete-work metadata, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::MissingCurrent { work_in_progress } => write!(
                formatter,
                "HostComponent work-in-progress fiber {} has no current alternate for private dangerousHTML/text reset complete-work metadata",
                work_in_progress.slot().get()
            ),
            Self::CurrentTagMismatch {
                current,
                current_tag,
                work_in_progress,
                work_in_progress_tag,
            } => write!(
                formatter,
                "private dangerousHTML/text reset complete-work metadata expected HostComponent alternate pair current {} {:?} and work-in-progress {} {:?}",
                current.slot().get(),
                current_tag,
                work_in_progress.slot().get(),
                work_in_progress_tag
            ),
            Self::MissingStateNode { fiber } => write!(
                formatter,
                "HostComponent fiber {} has no state node for private dangerousHTML/text reset complete-work metadata",
                fiber.slot().get()
            ),
            Self::StateNodeMismatch {
                current,
                work_in_progress,
                current_state_node,
                work_in_progress_state_node,
            } => write!(
                formatter,
                "private dangerousHTML/text reset complete-work metadata expected HostComponent current {} and work-in-progress {} to share state node {}; found {}",
                current.slot().get(),
                work_in_progress.slot().get(),
                current_state_node.raw(),
                work_in_progress_state_node.raw()
            ),
            Self::MissingUpdateFlag {
                work_in_progress,
                flags,
            } => write!(
                formatter,
                "HostComponent work-in-progress fiber {} must carry Update for private dangerousHTML/text reset complete-work metadata, found {:?}",
                work_in_progress.slot().get(),
                flags
            ),
        }
    }
}

impl Error for HostComponentDangerousHtmlTextResetCompleteWorkErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::ExpectedHostComponent { .. }
            | Self::MissingCurrent { .. }
            | Self::CurrentTagMismatch { .. }
            | Self::MissingStateNode { .. }
            | Self::StateNodeMismatch { .. }
            | Self::MissingUpdateFlag { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for HostComponentDangerousHtmlTextResetCompleteWorkErrorForCanary {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

pub(crate) fn host_component_dangerous_html_text_reset_complete_work_record_for_canary(
    arena: &FiberArena,
    root: FiberRootId,
    work_in_progress: FiberId,
    payload_kind: HostComponentDangerousHtmlTextResetPayloadKindForCanary,
) -> Result<
    HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary,
    HostComponentDangerousHtmlTextResetCompleteWorkErrorForCanary,
> {
    let work_in_progress_node = arena.get(work_in_progress)?;
    if work_in_progress_node.tag() != FiberTag::HostComponent {
        return Err(
            HostComponentDangerousHtmlTextResetCompleteWorkErrorForCanary::ExpectedHostComponent {
                fiber: work_in_progress,
                tag: work_in_progress_node.tag(),
            },
        );
    }

    let current = work_in_progress_node.alternate().ok_or(
        HostComponentDangerousHtmlTextResetCompleteWorkErrorForCanary::MissingCurrent {
            work_in_progress,
        },
    )?;
    let current_node = arena.get(current)?;
    if current_node.tag() != FiberTag::HostComponent {
        return Err(
            HostComponentDangerousHtmlTextResetCompleteWorkErrorForCanary::CurrentTagMismatch {
                current,
                current_tag: current_node.tag(),
                work_in_progress,
                work_in_progress_tag: work_in_progress_node.tag(),
            },
        );
    }

    let current_state_node = current_node.state_node();
    let work_in_progress_state_node = work_in_progress_node.state_node();
    if work_in_progress_state_node.is_none() {
        return Err(
            HostComponentDangerousHtmlTextResetCompleteWorkErrorForCanary::MissingStateNode {
                fiber: work_in_progress,
            },
        );
    }
    if current_state_node.is_none() {
        return Err(
            HostComponentDangerousHtmlTextResetCompleteWorkErrorForCanary::MissingStateNode {
                fiber: current,
            },
        );
    }
    if current_state_node != work_in_progress_state_node {
        return Err(
            HostComponentDangerousHtmlTextResetCompleteWorkErrorForCanary::StateNodeMismatch {
                current,
                work_in_progress,
                current_state_node,
                work_in_progress_state_node,
            },
        );
    }

    let effect_flag = work_in_progress_node.flags();
    if !effect_flag.contains_all(FiberFlags::UPDATE) {
        return Err(
            HostComponentDangerousHtmlTextResetCompleteWorkErrorForCanary::MissingUpdateFlag {
                work_in_progress,
                flags: effect_flag,
            },
        );
    }

    Ok(
        HostComponentDangerousHtmlTextResetCompleteWorkRecordForCanary {
            root,
            current,
            work_in_progress,
            state_node: work_in_progress_state_node,
            old_props: current_node.memoized_props(),
            new_props: work_in_progress_node.memoized_props(),
            payload_kind,
            effect_flag,
        },
    )
}
