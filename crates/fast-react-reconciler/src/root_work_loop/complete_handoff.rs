use std::error::Error;
use std::fmt::{self, Display, Formatter};

#[cfg(test)]
use fast_react_core::FiberTopologyError;
use fast_react_core::{ElementTypeHandle, FiberId, FiberTag, Lanes, PropsHandle};
use fast_react_host_config::{HostCommit, HostCreation, HostTypes, MutationHost};

use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostFiberTokenId, RootElementHandle,
    RootElementSource, RootRenderExitStatus,
    complete_work::{
        HostFiberTokenFactory, MinimalHostCompleteWorkError, MinimalHostRootCompleteWorkRecord,
        MinimalHostRootCompleteWorkRequest, complete_minimal_host_root_component_text,
    },
    host_nodes::HostNodeStore,
    root_commit::{
        HostRootCommitRecord, MinimalHostRootPlacementCommitError,
        MinimalHostRootPlacementCommitRecord, RootCommitError, commit_finished_host_root,
        commit_minimal_host_root_component_text_placement,
    },
};
#[cfg(test)]
use crate::{
    begin_work::{
        HostRootOneLevelChildSet, HostRootOneLevelChildSetBeginWorkError,
        HostRootOneLevelChildSetBeginWorkRecord, HostRootOneLevelChildSetKind,
        begin_work_host_root_one_level_child_set,
    },
    complete_work::{
        HostRootOneLevelChildSetCompletionError, HostRootOneLevelChildSetCompletionRecord,
        complete_host_root_one_level_child_set_for_test,
    },
    host_work::{
        HostWorkError, HostWorkResult, mount_test_host_sibling_work, mount_test_host_work,
    },
    root_commit::{
        HostRootFinishedWorkCommitHandoffErrorForCanary,
        HostRootFinishedWorkCommitHandoffRecordForCanary,
        HostRootFinishedWorkPendingCommitRecordForCanary,
        HostRootPlacementApplyDiagnosticForCanary,
        commit_completed_host_root_render_with_finished_work_handoff_for_canary,
        record_host_root_finished_work_pending_commit_for_canary,
    },
    test_support::{RecordingHost, TestHostTree},
};

#[cfg(test)]
use super::HostRootRenderPhaseRecord;
#[cfg(test)]
use super::{HostRootChildBeginWorkPreflightError, validate_host_root_child_preflight};
use super::{
    HostRootMinimalElementRenderPhaseError, HostRootMinimalElementRenderPhaseRecord,
    render_host_root_for_lanes_with_minimal_root_element,
};

pub(crate) trait HostRootMinimalRenderCompleteHandoffAdapter<H: HostTypes> {
    type Error;

    fn adapt_host_component_type(
        &mut self,
        element: RootElementHandle,
        element_type: ElementTypeHandle,
    ) -> Result<Option<H::Type>, Self::Error>;

    fn adapt_host_component_props(
        &mut self,
        element: RootElementHandle,
        props: PropsHandle,
    ) -> Result<Option<H::Props>, Self::Error>;
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootMinimalRenderCompleteHandoffRecord {
    render: HostRootMinimalElementRenderPhaseRecord,
    complete_work: MinimalHostRootCompleteWorkRecord,
}

impl HostRootMinimalRenderCompleteHandoffRecord {
    #[must_use]
    pub(crate) const fn render(&self) -> &HostRootMinimalElementRenderPhaseRecord {
        &self.render
    }

    #[must_use]
    pub(crate) const fn complete_work(&self) -> MinimalHostRootCompleteWorkRecord {
        self.complete_work
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.complete_work.root()
    }

    #[must_use]
    pub(crate) const fn host_root_work_in_progress(&self) -> FiberId {
        self.complete_work.host_root_work_in_progress()
    }

    #[must_use]
    pub(crate) const fn component(&self) -> FiberId {
        self.complete_work.component()
    }

    #[must_use]
    pub(crate) const fn text(&self) -> FiberId {
        self.complete_work.text()
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render.render_lanes()
    }

    #[must_use]
    pub(crate) const fn root_element(&self) -> RootElementHandle {
        self.render.root_element()
    }

    #[must_use]
    pub(crate) const fn detached_instance_count(&self) -> usize {
        1
    }

    #[must_use]
    pub(crate) const fn detached_text_count(&self) -> usize {
        1
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) fn proves_minimal_render_complete_handoff(&self) -> bool {
        self.render.proves_minimal_host_component_with_text_child()
            && self.complete_work.root() == self.render.root()
            && self.complete_work.host_root_work_in_progress()
                == self.render.host_root_work_in_progress()
            && self.complete_work.component() == self.render.root_child()
            && self.complete_work.text() == self.render.text_child()
            && !self.public_dom_compatibility_claimed()
            && self.public_compatibility_blocked()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootMinimalRenderCompletePlacementCommitRecord {
    complete_handoff: HostRootMinimalRenderCompleteHandoffRecord,
    commit: HostRootCommitRecord,
    placement_commit: MinimalHostRootPlacementCommitRecord,
    host_node_count_after_complete_work: usize,
    host_node_count_after_placement: usize,
}

impl HostRootMinimalRenderCompletePlacementCommitRecord {
    #[must_use]
    pub(crate) const fn complete_handoff(&self) -> &HostRootMinimalRenderCompleteHandoffRecord {
        &self.complete_handoff
    }

    #[must_use]
    pub(crate) const fn complete_work(&self) -> MinimalHostRootCompleteWorkRecord {
        self.complete_handoff.complete_work()
    }

    #[must_use]
    pub(crate) const fn commit(&self) -> &HostRootCommitRecord {
        &self.commit
    }

    #[must_use]
    pub(crate) const fn placement_commit(&self) -> MinimalHostRootPlacementCommitRecord {
        self.placement_commit
    }

    #[must_use]
    pub(crate) const fn host_node_count_after_complete_work(&self) -> usize {
        self.host_node_count_after_complete_work
    }

    #[must_use]
    pub(crate) const fn host_node_count_after_placement(&self) -> usize {
        self.host_node_count_after_placement
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_root_rendering_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_compatibility_blocked(&self) -> bool {
        true
    }

    #[must_use]
    pub(crate) fn proves_private_minimal_render_complete_placement_commit(&self) -> bool {
        let complete_work = self.complete_handoff.complete_work();
        self.complete_handoff
            .proves_minimal_render_complete_handoff()
            && self.commit.root() == self.complete_handoff.root()
            && self.commit.current() == complete_work.host_root_work_in_progress()
            && self.commit.finished_work() == complete_work.host_root_work_in_progress()
            && self.placement_commit.root() == self.commit.root()
            && self.placement_commit.previous_current() == self.commit.previous_current()
            && self.placement_commit.finished_work() == self.commit.current()
            && self.placement_commit.component() == complete_work.component()
            && self.placement_commit.text() == complete_work.text()
            && self.placement_commit.component_state_node() == complete_work.component_state_node()
            && self.placement_commit.text_state_node() == complete_work.text_state_node()
            && self.placement_commit.component_scope() == complete_work.component_scope()
            && self.placement_commit.text_scope() == complete_work.text_scope()
            && self.placement_commit.private_root_placement_only()
            && self.host_node_count_after_complete_work
                == self.complete_handoff.detached_instance_count()
                    + self.complete_handoff.detached_text_count()
            && self.host_node_count_after_placement == 0
            && !self.public_dom_compatibility_claimed()
            && !self.public_root_rendering_claimed()
            && self.public_root_rendering_blocked()
            && self.public_compatibility_blocked()
    }
}

#[doc(hidden)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MinimalHostRootRenderCompletePlacementDiagnostic {
    root: FiberRootId,
    previous_current: FiberId,
    host_root_work_in_progress: FiberId,
    finished_work: FiberId,
    component: FiberId,
    text: FiberId,
    root_element: RootElementHandle,
    component_element_type: ElementTypeHandle,
    component_props: PropsHandle,
    text_props: PropsHandle,
    text_content: String,
    render_lanes: Lanes,
    root_child_count: usize,
    component_child_count: usize,
    detached_instance_count: usize,
    detached_text_count: usize,
    host_node_count_after_complete_work: usize,
    host_node_count_after_placement: usize,
    component_state_node_raw: u64,
    text_state_node_raw: u64,
    component_token: HostFiberTokenId,
    text_token: HostFiberTokenId,
    placement_mutation_kind: &'static str,
    prepared_for_commit: bool,
    appended_child_to_container: bool,
    reset_after_commit: bool,
    private_root_placement_only: bool,
    host_mutation_gate_status: &'static str,
    host_mutation_gate_blockers_intact: bool,
    host_mutation_execution_blocked: bool,
    production_host_mutation_apply_promoted: bool,
    render_complete_handoff_proven: bool,
    private_render_complete_placement_proven: bool,
    public_dom_compatibility_claimed: bool,
    public_root_rendering_claimed: bool,
    public_root_rendering_blocked: bool,
    public_compatibility_blocked: bool,
    public_renderer_package_behavior_exposed: bool,
    react_dom_compatibility_claimed: bool,
    test_renderer_compatibility_claimed: bool,
}

impl MinimalHostRootRenderCompletePlacementDiagnostic {
    fn from_record(record: &HostRootMinimalRenderCompletePlacementCommitRecord) -> Self {
        let complete_handoff = record.complete_handoff();
        let render = complete_handoff.render();
        let complete_work = record.complete_work();
        let commit = record.commit();
        let placement = record.placement_commit();
        let gate = commit.host_component_text_mutation_execution_gate();

        Self {
            root: complete_handoff.root(),
            previous_current: commit.previous_current(),
            host_root_work_in_progress: complete_handoff.host_root_work_in_progress(),
            finished_work: commit.finished_work(),
            component: complete_handoff.component(),
            text: complete_handoff.text(),
            root_element: complete_handoff.root_element(),
            component_element_type: render.root_child_element_type(),
            component_props: render.root_child_props(),
            text_props: render.text_child_props(),
            text_content: render.text_child_text().to_owned(),
            render_lanes: complete_handoff.render_lanes(),
            root_child_count: render.root_child_count(),
            component_child_count: render.component_child_count(),
            detached_instance_count: complete_handoff.detached_instance_count(),
            detached_text_count: complete_handoff.detached_text_count(),
            host_node_count_after_complete_work: record.host_node_count_after_complete_work(),
            host_node_count_after_placement: record.host_node_count_after_placement(),
            component_state_node_raw: complete_work.component_state_node().raw(),
            text_state_node_raw: complete_work.text_state_node().raw(),
            component_token: complete_work.component_scope().token_id(),
            text_token: complete_work.text_scope().token_id(),
            placement_mutation_kind: if placement.private_root_placement_only() {
                "append-placement-to-container"
            } else {
                "unsupported-private-root-placement"
            },
            prepared_for_commit: placement.prepared_for_commit(),
            appended_child_to_container: placement.appended_child_to_container(),
            reset_after_commit: placement.reset_after_commit(),
            private_root_placement_only: placement.private_root_placement_only(),
            host_mutation_gate_status: gate.status_name(),
            host_mutation_gate_blockers_intact: gate.blockers_intact(),
            host_mutation_execution_blocked: gate.host_mutation_execution_blocked(),
            production_host_mutation_apply_promoted: gate.production_host_mutation_apply_promoted(),
            render_complete_handoff_proven: complete_handoff
                .proves_minimal_render_complete_handoff(),
            private_render_complete_placement_proven: record
                .proves_private_minimal_render_complete_placement_commit(),
            public_dom_compatibility_claimed: record.public_dom_compatibility_claimed(),
            public_root_rendering_claimed: record.public_root_rendering_claimed(),
            public_root_rendering_blocked: record.public_root_rendering_blocked(),
            public_compatibility_blocked: record.public_compatibility_blocked(),
            public_renderer_package_behavior_exposed: placement
                .public_renderer_package_behavior_exposed(),
            react_dom_compatibility_claimed: placement.react_dom_compatibility_claimed(),
            test_renderer_compatibility_claimed: placement.test_renderer_compatibility_claimed(),
        }
    }

    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn previous_current(&self) -> FiberId {
        self.previous_current
    }

    #[must_use]
    pub const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub const fn component(&self) -> FiberId {
        self.component
    }

    #[must_use]
    pub const fn text(&self) -> FiberId {
        self.text
    }

    #[must_use]
    pub const fn root_element(&self) -> RootElementHandle {
        self.root_element
    }

    #[must_use]
    pub const fn component_element_type(&self) -> ElementTypeHandle {
        self.component_element_type
    }

    #[must_use]
    pub const fn component_props(&self) -> PropsHandle {
        self.component_props
    }

    #[must_use]
    pub const fn text_props(&self) -> PropsHandle {
        self.text_props
    }

    #[must_use]
    pub fn text_content(&self) -> &str {
        &self.text_content
    }

    #[must_use]
    pub const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn render_lanes_bits(&self) -> u32 {
        self.render_lanes.bits()
    }

    #[must_use]
    pub const fn root_child_count(&self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub const fn component_child_count(&self) -> usize {
        self.component_child_count
    }

    #[must_use]
    pub const fn detached_instance_count(&self) -> usize {
        self.detached_instance_count
    }

    #[must_use]
    pub const fn detached_text_count(&self) -> usize {
        self.detached_text_count
    }

    #[must_use]
    pub const fn host_node_count_after_complete_work(&self) -> usize {
        self.host_node_count_after_complete_work
    }

    #[must_use]
    pub const fn host_node_count_after_placement(&self) -> usize {
        self.host_node_count_after_placement
    }

    #[must_use]
    pub const fn component_state_node_raw(&self) -> u64 {
        self.component_state_node_raw
    }

    #[must_use]
    pub const fn text_state_node_raw(&self) -> u64 {
        self.text_state_node_raw
    }

    #[must_use]
    pub const fn component_token(&self) -> HostFiberTokenId {
        self.component_token
    }

    #[must_use]
    pub const fn text_token(&self) -> HostFiberTokenId {
        self.text_token
    }

    #[must_use]
    pub const fn placement_mutation_kind(&self) -> &'static str {
        self.placement_mutation_kind
    }

    #[must_use]
    pub const fn prepared_for_commit(&self) -> bool {
        self.prepared_for_commit
    }

    #[must_use]
    pub const fn appended_child_to_container(&self) -> bool {
        self.appended_child_to_container
    }

    #[must_use]
    pub const fn reset_after_commit(&self) -> bool {
        self.reset_after_commit
    }

    #[must_use]
    pub const fn private_root_placement_only(&self) -> bool {
        self.private_root_placement_only
    }

    #[must_use]
    pub const fn host_mutation_gate_status(&self) -> &'static str {
        self.host_mutation_gate_status
    }

    #[must_use]
    pub const fn host_mutation_gate_blockers_intact(&self) -> bool {
        self.host_mutation_gate_blockers_intact
    }

    #[must_use]
    pub const fn host_mutation_execution_blocked(&self) -> bool {
        self.host_mutation_execution_blocked
    }

    #[must_use]
    pub const fn production_host_mutation_apply_promoted(&self) -> bool {
        self.production_host_mutation_apply_promoted
    }

    #[must_use]
    pub const fn render_complete_handoff_proven(&self) -> bool {
        self.render_complete_handoff_proven
    }

    #[must_use]
    pub const fn private_render_complete_placement_proven(&self) -> bool {
        self.private_render_complete_placement_proven
    }

    #[must_use]
    pub const fn public_dom_compatibility_claimed(&self) -> bool {
        self.public_dom_compatibility_claimed
    }

    #[must_use]
    pub const fn public_root_rendering_claimed(&self) -> bool {
        self.public_root_rendering_claimed
    }

    #[must_use]
    pub const fn public_root_rendering_blocked(&self) -> bool {
        self.public_root_rendering_blocked
    }

    #[must_use]
    pub const fn public_compatibility_blocked(&self) -> bool {
        self.public_compatibility_blocked
    }

    #[must_use]
    pub const fn public_renderer_package_behavior_exposed(&self) -> bool {
        self.public_renderer_package_behavior_exposed
    }

    #[must_use]
    pub const fn react_dom_compatibility_claimed(&self) -> bool {
        self.react_dom_compatibility_claimed
    }

    #[must_use]
    pub const fn test_renderer_compatibility_claimed(&self) -> bool {
        self.test_renderer_compatibility_claimed
    }
}

#[doc(hidden)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MinimalHostRootRenderCompletePlacementDiagnosticError {
    Render { message: String },
    CompletePlacement { message: String },
}

impl MinimalHostRootRenderCompletePlacementDiagnosticError {
    fn render(error: HostRootMinimalElementRenderPhaseError) -> Self {
        Self::Render {
            message: error.to_string(),
        }
    }

    fn complete_placement<E: Display>(
        error: HostRootMinimalRenderCompletePlacementCommitError<E>,
    ) -> Self {
        Self::CompletePlacement {
            message: error.to_string(),
        }
    }

    #[must_use]
    pub fn message(&self) -> &str {
        match self {
            Self::Render { message } | Self::CompletePlacement { message } => message,
        }
    }
}

impl Display for MinimalHostRootRenderCompletePlacementDiagnosticError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.message())
    }
}

impl Error for MinimalHostRootRenderCompletePlacementDiagnosticError {}

struct MinimalHostRootDiagnosticTokenFactory<F> {
    create_host_fiber_token: F,
}

impl<H, F> HostFiberTokenFactory<H> for MinimalHostRootDiagnosticTokenFactory<F>
where
    H: HostTypes,
    F: FnMut(HostFiberTokenId) -> H::HostFiberToken,
{
    fn create_host_fiber_token(&mut self, token_id: HostFiberTokenId) -> H::HostFiberToken {
        (self.create_host_fiber_token)(token_id)
    }
}

struct MinimalHostRootDiagnosticAdapter<AdaptType, AdaptProps> {
    adapt_host_component_type: AdaptType,
    adapt_host_component_props: AdaptProps,
}

impl<H, AdaptType, AdaptProps, E> HostRootMinimalRenderCompleteHandoffAdapter<H>
    for MinimalHostRootDiagnosticAdapter<AdaptType, AdaptProps>
where
    H: HostTypes,
    AdaptType: FnMut(RootElementHandle, ElementTypeHandle) -> Result<Option<H::Type>, E>,
    AdaptProps: FnMut(RootElementHandle, PropsHandle) -> Result<Option<H::Props>, E>,
{
    type Error = E;

    fn adapt_host_component_type(
        &mut self,
        element: RootElementHandle,
        element_type: ElementTypeHandle,
    ) -> Result<Option<H::Type>, Self::Error> {
        (self.adapt_host_component_type)(element, element_type)
    }

    fn adapt_host_component_props(
        &mut self,
        element: RootElementHandle,
        props: PropsHandle,
    ) -> Result<Option<H::Props>, Self::Error> {
        (self.adapt_host_component_props)(element, props)
    }
}

#[doc(hidden)]
pub fn describe_minimal_host_root_render_complete_placement_for_private_bridge<
    H,
    S,
    CreateToken,
    AdaptType,
    AdaptProps,
    E,
>(
    store: &mut FiberRootStore<H>,
    host: &mut H,
    root_id: FiberRootId,
    render_lanes: Lanes,
    source: &S,
    create_host_fiber_token: CreateToken,
    adapt_host_component_type: AdaptType,
    adapt_host_component_props: AdaptProps,
) -> Result<
    MinimalHostRootRenderCompletePlacementDiagnostic,
    MinimalHostRootRenderCompletePlacementDiagnosticError,
>
where
    H: HostCreation + HostCommit + MutationHost,
    S: RootElementSource + ?Sized,
    CreateToken: FnMut(HostFiberTokenId) -> H::HostFiberToken,
    AdaptType: FnMut(RootElementHandle, ElementTypeHandle) -> Result<Option<H::Type>, E>,
    AdaptProps: FnMut(RootElementHandle, PropsHandle) -> Result<Option<H::Props>, E>,
    E: Display,
{
    let render =
        render_host_root_for_lanes_with_minimal_root_element(store, root_id, render_lanes, source)
            .map_err(MinimalHostRootRenderCompletePlacementDiagnosticError::render)?;
    let mut host_nodes = HostNodeStore::<H>::new();
    let mut token_factory = MinimalHostRootDiagnosticTokenFactory {
        create_host_fiber_token,
    };
    let mut adapter = MinimalHostRootDiagnosticAdapter {
        adapt_host_component_type,
        adapt_host_component_props,
    };
    let record = commit_minimal_root_element_render_complete_handoff_to_host_placement(
        store,
        host,
        &mut host_nodes,
        &mut token_factory,
        render,
        &mut adapter,
    )
    .map_err(MinimalHostRootRenderCompletePlacementDiagnosticError::complete_placement)?;

    Ok(MinimalHostRootRenderCompletePlacementDiagnostic::from_record(&record))
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootMinimalRenderCompleteHandoffError<E> {
    FiberRootStore(FiberRootStoreError),
    Adapter(E),
    MinimalCompleteWork(MinimalHostCompleteWorkError),
    RenderPhaseWorkMismatch {
        root: FiberRootId,
        expected: Option<FiberId>,
        actual: FiberId,
    },
    RenderPhaseLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    RenderPhaseNotCompleted {
        root: FiberRootId,
        status: RootRenderExitStatus,
    },
    MinimalRenderRecordShapeMismatch {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    LiveRootChildMismatch {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        expected: FiberId,
        actual: Option<FiberId>,
        actual_child_count: usize,
    },
    LiveTextChildMismatch {
        root: FiberRootId,
        component: FiberId,
        expected: FiberId,
        actual: Option<FiberId>,
        actual_child_count: usize,
    },
    LiveFiberTagMismatch {
        root: FiberRootId,
        fiber: FiberId,
        expected: FiberTag,
        actual: FiberTag,
    },
    LiveComponentElementTypeMismatch {
        root: FiberRootId,
        component: FiberId,
        expected: ElementTypeHandle,
        actual: ElementTypeHandle,
    },
    LiveComponentPropsMismatch {
        root: FiberRootId,
        component: FiberId,
        expected: PropsHandle,
        actual: PropsHandle,
    },
    LiveTextPropsMismatch {
        root: FiberRootId,
        text: FiberId,
        expected: PropsHandle,
        actual: PropsHandle,
    },
    LiveTextChildrenMismatch {
        root: FiberRootId,
        text: FiberId,
        actual_child_count: usize,
    },
    PublicCompatibilityClaimed {
        root: FiberRootId,
        element: RootElementHandle,
    },
    UnadaptedHostComponentType {
        root: FiberRootId,
        element: RootElementHandle,
        element_type: ElementTypeHandle,
    },
    UnadaptedHostComponentProps {
        root: FiberRootId,
        element: RootElementHandle,
        props: PropsHandle,
    },
}

impl<E: Display> Display for HostRootMinimalRenderCompleteHandoffError<E> {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::Adapter(error) => Display::fmt(error, formatter),
            Self::MinimalCompleteWork(error) => Display::fmt(error, formatter),
            Self::RenderPhaseWorkMismatch {
                root,
                expected,
                actual,
            } => {
                if let Some(expected) = expected {
                    write!(
                        formatter,
                        "root {} minimal render recorded work fiber slot {}, complete-work handoff requested fiber slot {}",
                        root.raw(),
                        expected.slot().get(),
                        actual.slot().get()
                    )
                } else {
                    write!(
                        formatter,
                        "root {} has no recorded minimal render work for complete-work handoff requested fiber slot {}",
                        root.raw(),
                        actual.slot().get()
                    )
                }
            }
            Self::RenderPhaseLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} minimal render lanes {:?} do not match complete-work handoff lanes {:?}",
                root.raw(),
                expected,
                actual
            ),
            Self::RenderPhaseNotCompleted { root, status } => write!(
                formatter,
                "root {} minimal render must be completed before complete-work handoff, found {:?}",
                root.raw(),
                status
            ),
            Self::MinimalRenderRecordShapeMismatch {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} minimal render record for HostRoot work-in-progress {} does not prove HostRoot -> HostComponent -> HostText",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::LiveRootChildMismatch {
                root,
                host_root_work_in_progress,
                expected,
                actual,
                actual_child_count,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} live child tree no longer matches minimal render record: expected component {}, found {:?} across {} root children",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                expected.slot().get(),
                actual.map(|fiber| fiber.slot().get()),
                actual_child_count
            ),
            Self::LiveTextChildMismatch {
                root,
                component,
                expected,
                actual,
                actual_child_count,
            } => write!(
                formatter,
                "root {} HostComponent {} live text child no longer matches minimal render record: expected text {}, found {:?} across {} component children",
                root.raw(),
                component.slot().get(),
                expected.slot().get(),
                actual.map(|fiber| fiber.slot().get()),
                actual_child_count
            ),
            Self::LiveFiberTagMismatch {
                root,
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} live minimal render fiber {} must be {:?}, found {:?}",
                root.raw(),
                fiber.slot().get(),
                expected,
                actual
            ),
            Self::LiveComponentElementTypeMismatch {
                root,
                component,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} live HostComponent {} element type handle {} no longer matches minimal render record handle {}",
                root.raw(),
                component.slot().get(),
                actual.raw(),
                expected.raw()
            ),
            Self::LiveComponentPropsMismatch {
                root,
                component,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} live HostComponent {} props handle {} no longer matches minimal render record handle {}",
                root.raw(),
                component.slot().get(),
                actual.raw(),
                expected.raw()
            ),
            Self::LiveTextPropsMismatch {
                root,
                text,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} live HostText {} props handle {} no longer matches minimal render record handle {}",
                root.raw(),
                text.slot().get(),
                actual.raw(),
                expected.raw()
            ),
            Self::LiveTextChildrenMismatch {
                root,
                text,
                actual_child_count,
            } => write!(
                formatter,
                "root {} live HostText {} must not have children before minimal complete handoff, found {}",
                root.raw(),
                text.slot().get(),
                actual_child_count
            ),
            Self::PublicCompatibilityClaimed { root, element } => write!(
                formatter,
                "root {} minimal render element {} claimed public compatibility before private complete-work handoff",
                root.raw(),
                element.raw()
            ),
            Self::UnadaptedHostComponentType {
                root,
                element,
                element_type,
            } => write!(
                formatter,
                "root {} element {} host component type handle {} was not adapted for private complete-work handoff",
                root.raw(),
                element.raw(),
                element_type.raw()
            ),
            Self::UnadaptedHostComponentProps {
                root,
                element,
                props,
            } => write!(
                formatter,
                "root {} element {} host component props handle {} was not adapted for private complete-work handoff",
                root.raw(),
                element.raw(),
                props.raw()
            ),
        }
    }
}

impl<E> From<FiberRootStoreError> for HostRootMinimalRenderCompleteHandoffError<E> {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl<E> From<MinimalHostCompleteWorkError> for HostRootMinimalRenderCompleteHandoffError<E> {
    fn from(error: MinimalHostCompleteWorkError) -> Self {
        Self::MinimalCompleteWork(error)
    }
}

impl<E> Error for HostRootMinimalRenderCompleteHandoffError<E>
where
    E: Error + 'static,
{
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::Adapter(error) => Some(error),
            Self::MinimalCompleteWork(error) => Some(error),
            Self::RenderPhaseWorkMismatch { .. }
            | Self::RenderPhaseLanesMismatch { .. }
            | Self::RenderPhaseNotCompleted { .. }
            | Self::MinimalRenderRecordShapeMismatch { .. }
            | Self::LiveRootChildMismatch { .. }
            | Self::LiveTextChildMismatch { .. }
            | Self::LiveFiberTagMismatch { .. }
            | Self::LiveComponentElementTypeMismatch { .. }
            | Self::LiveComponentPropsMismatch { .. }
            | Self::LiveTextPropsMismatch { .. }
            | Self::LiveTextChildrenMismatch { .. }
            | Self::PublicCompatibilityClaimed { .. }
            | Self::UnadaptedHostComponentType { .. }
            | Self::UnadaptedHostComponentProps { .. } => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootMinimalRenderCompletePlacementCommitError<E> {
    CompleteHandoff(HostRootMinimalRenderCompleteHandoffError<E>),
    Commit(RootCommitError),
    PlacementCommit(MinimalHostRootPlacementCommitError),
}

impl<E: Display> Display for HostRootMinimalRenderCompletePlacementCommitError<E> {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::CompleteHandoff(error) => Display::fmt(error, formatter),
            Self::Commit(error) => Display::fmt(error, formatter),
            Self::PlacementCommit(error) => Display::fmt(error, formatter),
        }
    }
}

impl<E> Error for HostRootMinimalRenderCompletePlacementCommitError<E>
where
    E: Error + 'static,
{
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::CompleteHandoff(error) => Some(error),
            Self::Commit(error) => Some(error),
            Self::PlacementCommit(error) => Some(error),
        }
    }
}

impl<E> From<HostRootMinimalRenderCompleteHandoffError<E>>
    for HostRootMinimalRenderCompletePlacementCommitError<E>
{
    fn from(error: HostRootMinimalRenderCompleteHandoffError<E>) -> Self {
        Self::CompleteHandoff(error)
    }
}

impl<E> From<RootCommitError> for HostRootMinimalRenderCompletePlacementCommitError<E> {
    fn from(error: RootCommitError) -> Self {
        Self::Commit(error)
    }
}

impl<E> From<MinimalHostRootPlacementCommitError>
    for HostRootMinimalRenderCompletePlacementCommitError<E>
{
    fn from(error: MinimalHostRootPlacementCommitError) -> Self {
        Self::PlacementCommit(error)
    }
}

pub(crate) fn handoff_minimal_root_element_render_to_complete_work<H, A, T>(
    store: &mut FiberRootStore<H>,
    host: &mut H,
    host_nodes: &mut HostNodeStore<H>,
    token_factory: &mut T,
    render: HostRootMinimalElementRenderPhaseRecord,
    adapter: &mut A,
) -> Result<
    HostRootMinimalRenderCompleteHandoffRecord,
    HostRootMinimalRenderCompleteHandoffError<A::Error>,
>
where
    H: HostCreation,
    A: HostRootMinimalRenderCompleteHandoffAdapter<H>,
    T: HostFiberTokenFactory<H>,
{
    validate_minimal_render_for_complete_work_handoff(store, &render)?;
    if !render.proves_minimal_host_component_with_text_child() {
        return Err(
            HostRootMinimalRenderCompleteHandoffError::MinimalRenderRecordShapeMismatch {
                root: render.root(),
                host_root_work_in_progress: render.host_root_work_in_progress(),
            },
        );
    }
    if render.public_compatibility_claimed() {
        return Err(
            HostRootMinimalRenderCompleteHandoffError::PublicCompatibilityClaimed {
                root: render.root(),
                element: render.root_element(),
            },
        );
    }
    validate_live_minimal_render_tree_matches_record(store, &render)?;

    let component_type = adapter
        .adapt_host_component_type(render.root_element(), render.root_child_element_type())
        .map_err(HostRootMinimalRenderCompleteHandoffError::Adapter)?
        .ok_or(
            HostRootMinimalRenderCompleteHandoffError::UnadaptedHostComponentType {
                root: render.root(),
                element: render.root_element(),
                element_type: render.root_child_element_type(),
            },
        )?;
    let component_props = adapter
        .adapt_host_component_props(render.root_element(), render.root_child_props())
        .map_err(HostRootMinimalRenderCompleteHandoffError::Adapter)?
        .ok_or(
            HostRootMinimalRenderCompleteHandoffError::UnadaptedHostComponentProps {
                root: render.root(),
                element: render.root_element(),
                props: render.root_child_props(),
            },
        )?;

    let complete_work = complete_minimal_host_root_component_text(
        store,
        host,
        host_nodes,
        token_factory,
        MinimalHostRootCompleteWorkRequest::new(
            render.root(),
            render.host_root_work_in_progress(),
            &component_type,
            &component_props,
            render.text_child_text(),
        ),
    )?;

    Ok(HostRootMinimalRenderCompleteHandoffRecord {
        render,
        complete_work,
    })
}

#[allow(
    dead_code,
    reason = "private minimal render-to-placement diagnostic is intentionally not wired into public root rendering"
)]
pub(crate) fn commit_minimal_root_element_render_complete_handoff_to_host_placement<H, A, T>(
    store: &mut FiberRootStore<H>,
    host: &mut H,
    host_nodes: &mut HostNodeStore<H>,
    token_factory: &mut T,
    render: HostRootMinimalElementRenderPhaseRecord,
    adapter: &mut A,
) -> Result<
    HostRootMinimalRenderCompletePlacementCommitRecord,
    HostRootMinimalRenderCompletePlacementCommitError<A::Error>,
>
where
    H: HostCreation + HostCommit + MutationHost,
    A: HostRootMinimalRenderCompleteHandoffAdapter<H>,
    T: HostFiberTokenFactory<H>,
{
    let render_for_commit = render.render();
    let complete_handoff = handoff_minimal_root_element_render_to_complete_work(
        store,
        host,
        host_nodes,
        token_factory,
        render,
        adapter,
    )?;
    let host_node_count_after_complete_work = host_nodes.instance_count() + host_nodes.text_count();
    let commit = commit_finished_host_root(store, render_for_commit)?;
    let placement_commit = commit_minimal_host_root_component_text_placement(
        store,
        host,
        host_nodes,
        complete_handoff.complete_work(),
        &commit,
    )?;
    let host_node_count_after_placement = host_nodes.instance_count() + host_nodes.text_count();

    Ok(HostRootMinimalRenderCompletePlacementCommitRecord {
        complete_handoff,
        commit,
        placement_commit,
        host_node_count_after_complete_work,
        host_node_count_after_placement,
    })
}

fn validate_minimal_render_for_complete_work_handoff<H: HostTypes, E>(
    store: &FiberRootStore<H>,
    render: &HostRootMinimalElementRenderPhaseRecord,
) -> Result<(), HostRootMinimalRenderCompleteHandoffError<E>> {
    let root_id = render.root();
    let scheduling = store.root(root_id)?.scheduling();

    if scheduling.work_in_progress() != Some(render.host_root_work_in_progress()) {
        return Err(
            HostRootMinimalRenderCompleteHandoffError::RenderPhaseWorkMismatch {
                root: root_id,
                expected: scheduling.work_in_progress(),
                actual: render.host_root_work_in_progress(),
            },
        );
    }

    if scheduling.work_in_progress_root_render_lanes() != render.render_lanes() {
        return Err(
            HostRootMinimalRenderCompleteHandoffError::RenderPhaseLanesMismatch {
                root: root_id,
                expected: scheduling.work_in_progress_root_render_lanes(),
                actual: render.render_lanes(),
            },
        );
    }

    if scheduling.render_exit_status() != RootRenderExitStatus::Completed {
        return Err(
            HostRootMinimalRenderCompleteHandoffError::RenderPhaseNotCompleted {
                root: root_id,
                status: scheduling.render_exit_status(),
            },
        );
    }

    Ok(())
}

fn validate_live_minimal_render_tree_matches_record<H: HostTypes, E>(
    store: &FiberRootStore<H>,
    render: &HostRootMinimalElementRenderPhaseRecord,
) -> Result<(), HostRootMinimalRenderCompleteHandoffError<E>> {
    let root = render.root();
    let arena = store.fiber_arena();
    let root_children = arena
        .child_ids(render.host_root_work_in_progress())
        .map_err(MinimalHostCompleteWorkError::from)?;
    if root_children.as_slice() != [render.root_child()] {
        return Err(
            HostRootMinimalRenderCompleteHandoffError::LiveRootChildMismatch {
                root,
                host_root_work_in_progress: render.host_root_work_in_progress(),
                expected: render.root_child(),
                actual: root_children.first().copied(),
                actual_child_count: root_children.len(),
            },
        );
    }

    let component = arena
        .get(render.root_child())
        .map_err(MinimalHostCompleteWorkError::from)?;
    if component.tag() != FiberTag::HostComponent {
        return Err(
            HostRootMinimalRenderCompleteHandoffError::LiveFiberTagMismatch {
                root,
                fiber: render.root_child(),
                expected: FiberTag::HostComponent,
                actual: component.tag(),
            },
        );
    }
    if component.element_type() != render.root_child_element_type() {
        return Err(
            HostRootMinimalRenderCompleteHandoffError::LiveComponentElementTypeMismatch {
                root,
                component: render.root_child(),
                expected: render.root_child_element_type(),
                actual: component.element_type(),
            },
        );
    }
    if component.pending_props() != render.root_child_props() {
        return Err(
            HostRootMinimalRenderCompleteHandoffError::LiveComponentPropsMismatch {
                root,
                component: render.root_child(),
                expected: render.root_child_props(),
                actual: component.pending_props(),
            },
        );
    }

    let component_children = arena
        .child_ids(render.root_child())
        .map_err(MinimalHostCompleteWorkError::from)?;
    if component_children.as_slice() != [render.text_child()] {
        return Err(
            HostRootMinimalRenderCompleteHandoffError::LiveTextChildMismatch {
                root,
                component: render.root_child(),
                expected: render.text_child(),
                actual: component_children.first().copied(),
                actual_child_count: component_children.len(),
            },
        );
    }

    let text = arena
        .get(render.text_child())
        .map_err(MinimalHostCompleteWorkError::from)?;
    if text.tag() != FiberTag::HostText {
        return Err(
            HostRootMinimalRenderCompleteHandoffError::LiveFiberTagMismatch {
                root,
                fiber: render.text_child(),
                expected: FiberTag::HostText,
                actual: text.tag(),
            },
        );
    }
    // HostText text content is owned by the minimal render record; pending
    // props are the live same-fiber drift guard.
    if text.pending_props() != render.text_child_props() {
        return Err(
            HostRootMinimalRenderCompleteHandoffError::LiveTextPropsMismatch {
                root,
                text: render.text_child(),
                expected: render.text_child_props(),
                actual: text.pending_props(),
            },
        );
    }

    let text_children = arena
        .child_ids(render.text_child())
        .map_err(MinimalHostCompleteWorkError::from)?;
    if !text_children.is_empty() {
        return Err(
            HostRootMinimalRenderCompleteHandoffError::LiveTextChildrenMismatch {
                root,
                text: render.text_child(),
                actual_child_count: text_children.len(),
            },
        );
    }

    Ok(())
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct HostRootCompleteWorkHandoffRecord {
    pub(super) root: FiberRootId,
    pub(super) host_root_work_in_progress: FiberId,
    pub(super) root_child: Option<FiberId>,
    pub(super) root_child_tag: Option<FiberTag>,
    pub(super) root_child_count: usize,
    pub(super) last_root_child: Option<FiberId>,
    pub(super) last_root_child_tag: Option<FiberTag>,
    pub(super) completed_child: Option<FiberId>,
    pub(super) completed_child_tag: Option<FiberTag>,
    pub(super) completed_child_count: usize,
    pub(super) last_completed_child: Option<FiberId>,
    pub(super) last_completed_child_tag: Option<FiberTag>,
    pub(super) render_lanes: Lanes,
    pub(super) resulting_element: RootElementHandle,
    pub(super) detached_instance_count: usize,
    pub(super) detached_text_count: usize,
}

#[cfg(test)]
impl HostRootCompleteWorkHandoffRecord {
    #[must_use]
    pub(super) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(super) const fn root_child(self) -> Option<FiberId> {
        self.root_child
    }

    #[must_use]
    pub(super) const fn root_child_tag(self) -> Option<FiberTag> {
        self.root_child_tag
    }

    #[must_use]
    pub(super) const fn root_child_count(self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub(super) const fn last_root_child(self) -> Option<FiberId> {
        self.last_root_child
    }

    #[must_use]
    pub(super) const fn last_root_child_tag(self) -> Option<FiberTag> {
        self.last_root_child_tag
    }

    #[must_use]
    pub(super) const fn completed_child(self) -> Option<FiberId> {
        self.completed_child
    }

    #[must_use]
    pub(super) const fn completed_child_tag(self) -> Option<FiberTag> {
        self.completed_child_tag
    }

    #[must_use]
    pub(super) const fn completed_child_count(self) -> usize {
        self.completed_child_count
    }

    #[must_use]
    pub(super) const fn last_completed_child(self) -> Option<FiberId> {
        self.last_completed_child
    }

    #[must_use]
    pub(super) const fn last_completed_child_tag(self) -> Option<FiberTag> {
        self.last_completed_child_tag
    }

    #[must_use]
    pub(super) const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(super) const fn resulting_element(self) -> RootElementHandle {
        self.resulting_element
    }

    #[must_use]
    pub(super) const fn detached_instance_count(self) -> usize {
        self.detached_instance_count
    }

    #[must_use]
    pub(super) const fn detached_text_count(self) -> usize {
        self.detached_text_count
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum HostRootCompleteWorkHandoffError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    HostWork(HostWorkError),
    ExistingRootChildUnsupported {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    RenderPhaseWorkMismatch {
        root: FiberRootId,
        expected: Option<FiberId>,
        actual: FiberId,
    },
    RenderPhaseLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    RenderPhaseNotCompleted {
        root: FiberRootId,
        status: RootRenderExitStatus,
    },
    UnexpectedExistingRootChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

#[cfg(test)]
impl Display for HostRootCompleteWorkHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::HostWork(error) => Display::fmt(error, formatter),
            Self::ExistingRootChildUnsupported {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} already has child {} ({:?}); private direct host complete-work handoff only admits an empty HostRoot child list",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::RenderPhaseWorkMismatch {
                root,
                expected,
                actual,
            } => {
                if let Some(expected) = expected {
                    write!(
                        formatter,
                        "root {} render phase recorded work fiber slot {}, complete-work handoff requested fiber slot {}",
                        root.raw(),
                        expected.slot().get(),
                        actual.slot().get()
                    )
                } else {
                    write!(
                        formatter,
                        "root {} has no recorded render phase work for complete-work handoff requested fiber slot {}",
                        root.raw(),
                        actual.slot().get()
                    )
                }
            }
            Self::RenderPhaseLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} render phase lanes {:?} do not match complete-work handoff lanes {:?}",
                root.raw(),
                expected,
                actual
            ),
            Self::RenderPhaseNotCompleted { root, status } => write!(
                formatter,
                "root {} render phase must be completed before complete-work handoff, found {:?}",
                root.raw(),
                status
            ),
            Self::UnexpectedExistingRootChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} already has child {} with tag {:?}; private host complete-work handoff only admits a fresh root child",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootCompleteWorkHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::HostWork(error) => Some(error),
            Self::ExistingRootChildUnsupported { .. }
            | Self::RenderPhaseWorkMismatch { .. }
            | Self::RenderPhaseLanesMismatch { .. }
            | Self::RenderPhaseNotCompleted { .. }
            | Self::UnexpectedExistingRootChild { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<FiberRootStoreError> for HostRootCompleteWorkHandoffError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

#[cfg(test)]
impl From<FiberTopologyError> for HostRootCompleteWorkHandoffError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError> for HostRootCompleteWorkHandoffError {
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<HostWorkError> for HostRootCompleteWorkHandoffError {
    fn from(error: HostWorkError) -> Self {
        Self::HostWork(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct HostRootCompleteWorkCommitHandoffRecord {
    pub(super) complete_work: HostRootCompleteWorkHandoffRecord,
    pub(super) finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    pub(super) placement_apply_diagnostics: Vec<HostRootPlacementApplyDiagnosticForCanary>,
    pub(super) host_operation_count_after_complete_work: usize,
    pub(super) host_operation_count_after_commit: usize,
}

#[cfg(test)]
impl HostRootCompleteWorkCommitHandoffRecord {
    #[must_use]
    pub(super) const fn complete_work(&self) -> HostRootCompleteWorkHandoffRecord {
        self.complete_work
    }

    #[must_use]
    pub(super) const fn commit(&self) -> &HostRootCommitRecord {
        self.finished_work_handoff.commit()
    }

    #[must_use]
    pub(super) const fn finished_work_handoff(
        &self,
    ) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        &self.finished_work_handoff
    }

    #[must_use]
    pub(super) fn placement_apply_diagnostics(
        &self,
    ) -> &[HostRootPlacementApplyDiagnosticForCanary] {
        &self.placement_apply_diagnostics
    }

    #[must_use]
    pub(super) const fn host_operation_count_after_complete_work(&self) -> usize {
        self.host_operation_count_after_complete_work
    }

    #[must_use]
    pub(super) const fn host_operation_count_after_commit(&self) -> usize {
        self.host_operation_count_after_commit
    }

    #[must_use]
    pub(super) const fn host_operations_unchanged_by_commit(&self) -> bool {
        self.host_operation_count_after_complete_work == self.host_operation_count_after_commit
    }

    #[must_use]
    pub(super) const fn public_render_blocked(&self) -> bool {
        true
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum HostRootCompleteWorkCommitHandoffError {
    CompleteWork(HostRootCompleteWorkHandoffError),
    FinishedWorkCommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
}

#[cfg(test)]
impl Display for HostRootCompleteWorkCommitHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::FinishedWorkCommitHandoff(error) => Display::fmt(error, formatter),
        }
    }
}

#[cfg(test)]
impl Error for HostRootCompleteWorkCommitHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::CompleteWork(error) => Some(error),
            Self::FinishedWorkCommitHandoff(error) => Some(error.as_ref()),
        }
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError> for HostRootCompleteWorkCommitHandoffError {
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for HostRootCompleteWorkCommitHandoffError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWorkCommitHandoff(Box::new(error))
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct HostRootRenderFinishedWorkCommitMetadataHandoffRecord {
    pub(super) root: FiberRootId,
    pub(super) previous_current: FiberId,
    pub(super) finished_work: FiberId,
    pub(super) render_lanes: Lanes,
    pub(super) root_finished_work_before_handoff: Option<FiberId>,
    pub(super) root_finished_lanes_before_handoff: Lanes,
    pub(super) root_finished_work_after_handoff: Option<FiberId>,
    pub(super) root_finished_lanes_after_handoff: Lanes,
    pub(super) pending_commit: HostRootFinishedWorkPendingCommitRecordForCanary,
}

#[cfg(test)]
impl HostRootRenderFinishedWorkCommitMetadataHandoffRecord {
    #[must_use]
    pub(super) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(super) const fn previous_current(self) -> FiberId {
        self.previous_current
    }

    #[must_use]
    pub(super) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(super) const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(super) const fn root_finished_work_before_handoff(self) -> Option<FiberId> {
        self.root_finished_work_before_handoff
    }

    #[must_use]
    pub(super) const fn root_finished_lanes_before_handoff(self) -> Lanes {
        self.root_finished_lanes_before_handoff
    }

    #[must_use]
    pub(super) const fn root_finished_work_after_handoff(self) -> Option<FiberId> {
        self.root_finished_work_after_handoff
    }

    #[must_use]
    pub(super) const fn root_finished_lanes_after_handoff(self) -> Lanes {
        self.root_finished_lanes_after_handoff
    }

    #[must_use]
    pub(super) const fn pending_commit(self) -> HostRootFinishedWorkPendingCommitRecordForCanary {
        self.pending_commit
    }

    #[must_use]
    pub(super) fn records_completed_render_as_root_finished_work(self) -> bool {
        self.root_finished_work_after_handoff == Some(self.finished_work)
            && self.root_finished_lanes_after_handoff == self.render_lanes
            && self.pending_commit.root_finished_work() == Some(self.finished_work)
            && self.pending_commit.root_finished_lanes() == self.render_lanes
            && self.pending_commit.records_root_finished_work()
    }

    #[must_use]
    pub(super) const fn host_mutation_blocked(self) -> bool {
        true
    }

    #[must_use]
    pub(super) const fn public_root_rendering_blocked(self) -> bool {
        true
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum HostRootRenderFinishedWorkCommitMetadataHandoffError {
    FiberRootStore(FiberRootStoreError),
    RenderPhaseWorkMismatch {
        root: FiberRootId,
        expected: Option<FiberId>,
        actual: FiberId,
    },
    RenderPhaseLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    RenderPhaseNotCompleted {
        root: FiberRootId,
        status: RootRenderExitStatus,
    },
    FinishedWorkCommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
}

#[cfg(test)]
impl Display for HostRootRenderFinishedWorkCommitMetadataHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::RenderPhaseWorkMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} completed render expected work {:?} before finished-work metadata handoff, found fiber slot {}",
                root.raw(),
                expected.map(|fiber| fiber.slot().get()),
                actual.slot().get()
            ),
            Self::RenderPhaseLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} completed render lanes {:?} do not match finished-work metadata handoff lanes {:?}",
                root.raw(),
                expected,
                actual
            ),
            Self::RenderPhaseNotCompleted { root, status } => write!(
                formatter,
                "root {} render phase must be completed before finished-work metadata handoff, found {:?}",
                root.raw(),
                status
            ),
            Self::FinishedWorkCommitHandoff(error) => Display::fmt(error, formatter),
        }
    }
}

#[cfg(test)]
impl Error for HostRootRenderFinishedWorkCommitMetadataHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FinishedWorkCommitHandoff(error) => Some(error.as_ref()),
            Self::RenderPhaseWorkMismatch { .. }
            | Self::RenderPhaseLanesMismatch { .. }
            | Self::RenderPhaseNotCompleted { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<FiberRootStoreError> for HostRootRenderFinishedWorkCommitMetadataHandoffError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for HostRootRenderFinishedWorkCommitMetadataHandoffError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWorkCommitHandoff(Box::new(error))
    }
}

#[cfg(test)]
pub(super) fn handoff_completed_host_root_render_to_finished_work_commit_metadata_for_canary<
    H: HostTypes,
>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    handoff_order: usize,
) -> Result<
    HostRootRenderFinishedWorkCommitMetadataHandoffRecord,
    HostRootRenderFinishedWorkCommitMetadataHandoffError,
> {
    validate_completed_host_root_render_for_finished_work_commit_metadata_handoff(store, render)?;

    let root_id = render.root();
    let (root_finished_work_before_handoff, root_finished_lanes_before_handoff) = {
        let root = store.root(root_id)?;
        (root.finished_work(), root.finished_lanes())
    };
    {
        let root = store.root_mut(root_id)?;
        root.record_finished_work_for_canary(render.finished_work(), render.render_lanes());
    }
    let pending_commit =
        record_host_root_finished_work_pending_commit_for_canary(store, render, handoff_order)?;
    let root = store.root(root_id)?;

    Ok(HostRootRenderFinishedWorkCommitMetadataHandoffRecord {
        root: root_id,
        previous_current: render.current(),
        finished_work: render.finished_work(),
        render_lanes: render.render_lanes(),
        root_finished_work_before_handoff,
        root_finished_lanes_before_handoff,
        root_finished_work_after_handoff: root.finished_work(),
        root_finished_lanes_after_handoff: root.finished_lanes(),
        pending_commit,
    })
}

#[cfg(test)]
pub(super) fn validate_completed_host_root_render_for_finished_work_commit_metadata_handoff<
    H: HostTypes,
>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
) -> Result<(), HostRootRenderFinishedWorkCommitMetadataHandoffError> {
    let root_id = render.root();
    let scheduling = store.root(root_id)?.scheduling();

    if scheduling.work_in_progress() != Some(render.work_in_progress()) {
        return Err(
            HostRootRenderFinishedWorkCommitMetadataHandoffError::RenderPhaseWorkMismatch {
                root: root_id,
                expected: scheduling.work_in_progress(),
                actual: render.work_in_progress(),
            },
        );
    }

    if scheduling.work_in_progress_root_render_lanes() != render.render_lanes() {
        return Err(
            HostRootRenderFinishedWorkCommitMetadataHandoffError::RenderPhaseLanesMismatch {
                root: root_id,
                expected: scheduling.work_in_progress_root_render_lanes(),
                actual: render.render_lanes(),
            },
        );
    }

    if scheduling.render_exit_status() != RootRenderExitStatus::Completed {
        return Err(
            HostRootRenderFinishedWorkCommitMetadataHandoffError::RenderPhaseNotCompleted {
                root: root_id,
                status: scheduling.render_exit_status(),
            },
        );
    }

    Ok(())
}

#[cfg(test)]
pub(super) fn handoff_completed_host_root_render_to_test_complete_work(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
) -> Result<HostRootCompleteWorkHandoffRecord, HostRootCompleteWorkHandoffError> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    validate_host_root_has_no_existing_child_for_complete_work_handoff(store, render)?;

    let host_work = mount_test_host_work(store, host, render, source)?;
    host_root_complete_work_handoff_record_from_host_work(
        store,
        render,
        render.resulting_element(),
        &host_work,
    )
}

#[cfg(test)]
pub(super) fn handoff_completed_host_root_render_to_test_complete_work_and_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
) -> Result<HostRootCompleteWorkCommitHandoffRecord, HostRootCompleteWorkCommitHandoffError> {
    let complete_work =
        handoff_completed_host_root_render_to_test_complete_work(store, host, render, source)?;
    let host_operation_count_after_complete_work = host.operations().len();
    let finished_work_handoff =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            store, render, 1, 2,
        )?;
    let host_operation_count_after_commit = host.operations().len();
    let placement_apply_diagnostics = finished_work_handoff
        .commit()
        .host_root_placement_apply_diagnostics_for_canary();

    Ok(HostRootCompleteWorkCommitHandoffRecord {
        complete_work,
        finished_work_handoff,
        placement_apply_diagnostics,
        host_operation_count_after_complete_work,
        host_operation_count_after_commit,
    })
}

#[cfg(test)]
pub(super) fn handoff_completed_host_root_render_to_test_complete_work_for_siblings(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    source_children: &[RootElementHandle],
) -> Result<HostRootCompleteWorkHandoffRecord, HostRootCompleteWorkHandoffError> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    validate_empty_host_root_child_list_for_complete_work_handoff(store, render)?;

    let host_work = mount_test_host_sibling_work(store, host, render, source, source_children)?;
    host_root_complete_work_handoff_record_from_host_work(
        store,
        render,
        render.resulting_element(),
        &host_work,
    )
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct HostRootOneLevelChildSetCompleteWorkHandoffRecord {
    pub(super) begin_work: HostRootOneLevelChildSetBeginWorkRecord,
    pub(super) child_set_completion: HostRootOneLevelChildSetCompletionRecord,
    pub(super) complete_work: HostRootCompleteWorkHandoffRecord,
}

#[cfg(test)]
impl HostRootOneLevelChildSetCompleteWorkHandoffRecord {
    #[must_use]
    pub(super) fn begin_work(&self) -> &HostRootOneLevelChildSetBeginWorkRecord {
        &self.begin_work
    }

    #[must_use]
    pub(super) const fn child_set_completion(&self) -> HostRootOneLevelChildSetCompletionRecord {
        self.child_set_completion
    }

    #[must_use]
    pub(super) const fn complete_work(&self) -> HostRootCompleteWorkHandoffRecord {
        self.complete_work
    }

    #[must_use]
    pub(super) const fn kind(&self) -> HostRootOneLevelChildSetKind {
        self.begin_work.kind()
    }

    #[must_use]
    pub(super) const fn root_element(&self) -> RootElementHandle {
        self.begin_work.root_element()
    }

    #[must_use]
    pub(super) const fn child_count(&self) -> usize {
        self.begin_work.child_count()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum HostRootOneLevelChildSetCompleteWorkHandoffError {
    CompleteWork(HostRootCompleteWorkHandoffError),
    BeginWork(HostRootOneLevelChildSetBeginWorkError),
    ChildSetCompletion(HostRootOneLevelChildSetCompletionError),
    RootElementMismatch {
        render_element: RootElementHandle,
        child_set_element: RootElementHandle,
    },
    MissingTestRootElement {
        element: RootElementHandle,
    },
}

#[cfg(test)]
impl Display for HostRootOneLevelChildSetCompleteWorkHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::BeginWork(error) => Display::fmt(error, formatter),
            Self::ChildSetCompletion(error) => Display::fmt(error, formatter),
            Self::RootElementMismatch {
                render_element,
                child_set_element,
            } => write!(
                formatter,
                "HostRoot render produced element {}, but private one-level child-set handoff was given element {}",
                render_element.raw(),
                child_set_element.raw()
            ),
            Self::MissingTestRootElement { element } => write!(
                formatter,
                "private one-level child-set handoff references missing test host element {}",
                element.raw()
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootOneLevelChildSetCompleteWorkHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::CompleteWork(error) => Some(error),
            Self::BeginWork(error) => Some(error),
            Self::ChildSetCompletion(error) => Some(error),
            Self::RootElementMismatch { .. } | Self::MissingTestRootElement { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError> for HostRootOneLevelChildSetCompleteWorkHandoffError {
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<HostRootOneLevelChildSetBeginWorkError>
    for HostRootOneLevelChildSetCompleteWorkHandoffError
{
    fn from(error: HostRootOneLevelChildSetBeginWorkError) -> Self {
        Self::BeginWork(error)
    }
}

#[cfg(test)]
impl From<HostRootOneLevelChildSetCompletionError>
    for HostRootOneLevelChildSetCompleteWorkHandoffError
{
    fn from(error: HostRootOneLevelChildSetCompletionError) -> Self {
        Self::ChildSetCompletion(error)
    }
}

#[cfg(test)]
pub(super) fn handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    child_set: &HostRootOneLevelChildSet,
) -> Result<
    HostRootOneLevelChildSetCompleteWorkHandoffRecord,
    HostRootOneLevelChildSetCompleteWorkHandoffError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    if render.resulting_element() != child_set.root_element() {
        return Err(
            HostRootOneLevelChildSetCompleteWorkHandoffError::RootElementMismatch {
                render_element: render.resulting_element(),
                child_set_element: child_set.root_element(),
            },
        );
    }
    validate_empty_host_root_child_list_for_complete_work_handoff(store, render)?;
    let begin_work = begin_work_host_root_one_level_child_set(child_set)?;
    for &element in begin_work.children() {
        if source.root(element).is_none() {
            return Err(
                HostRootOneLevelChildSetCompleteWorkHandoffError::MissingTestRootElement {
                    element,
                },
            );
        }
    }

    let host_work =
        mount_test_host_sibling_work(store, host, render, source, begin_work.children())
            .map_err(HostRootCompleteWorkHandoffError::from)?;
    let child_set_completion = complete_host_root_one_level_child_set_for_test(
        store.fiber_arena_mut(),
        render.work_in_progress(),
        begin_work.child_count(),
    )?;
    let complete_work = host_root_complete_work_handoff_record_from_host_work(
        store,
        render,
        render.resulting_element(),
        &host_work,
    )?;

    Ok(HostRootOneLevelChildSetCompleteWorkHandoffRecord {
        begin_work,
        child_set_completion,
        complete_work,
    })
}

#[cfg(test)]
pub(super) fn validate_host_root_has_no_existing_child_for_complete_work_handoff(
    store: &FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
) -> Result<(), HostRootCompleteWorkHandoffError> {
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )?;

    if let Some(child) = validated.child {
        return Err(
            HostRootCompleteWorkHandoffError::UnexpectedExistingRootChild {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child,
                tag: validated
                    .child_tag
                    .expect("validated child preflight must report a tag"),
            },
        );
    }

    Ok(())
}

#[cfg(test)]
pub(super) fn host_root_complete_work_handoff_record_from_host_work(
    store: &FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    resulting_element: RootElementHandle,
    host_work: &HostWorkResult,
) -> Result<HostRootCompleteWorkHandoffRecord, HostRootCompleteWorkHandoffError> {
    let root_child = host_work.root_child();
    let root_child_tag = optional_fiber_tag(store, root_child)?;
    let last_root_child = host_work.root_children().last().copied();
    let last_root_child_tag = optional_fiber_tag(store, last_root_child)?;
    let completed_child = host_work.completed_child();
    let completed_child_tag = optional_fiber_tag(store, completed_child)?;
    let last_completed_child = host_work.completed_children().last().copied();
    let last_completed_child_tag = optional_fiber_tag(store, last_completed_child)?;

    Ok(HostRootCompleteWorkHandoffRecord {
        root: host_work.root(),
        host_root_work_in_progress: host_work.work_in_progress(),
        root_child,
        root_child_tag,
        root_child_count: host_work.root_child_count(),
        last_root_child,
        last_root_child_tag,
        completed_child,
        completed_child_tag,
        completed_child_count: host_work.completed_child_count(),
        last_completed_child,
        last_completed_child_tag,
        render_lanes: render.render_lanes(),
        resulting_element,
        detached_instance_count: host_work.detached_instance_count(),
        detached_text_count: host_work.detached_text_count(),
    })
}

#[cfg(test)]
pub(super) fn validate_empty_host_root_child_list_for_complete_work_handoff(
    store: &FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
) -> Result<(), HostRootCompleteWorkHandoffError> {
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )?;
    if let Some(child) = validated.child {
        return Err(
            HostRootCompleteWorkHandoffError::ExistingRootChildUnsupported {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child,
                tag: validated
                    .child_tag
                    .expect("validated HostRoot child carries a tag"),
            },
        );
    }

    Ok(())
}

#[cfg(test)]
pub(super) fn optional_fiber_tag(
    store: &FiberRootStore<RecordingHost>,
    fiber: Option<FiberId>,
) -> Result<Option<FiberTag>, HostRootCompleteWorkHandoffError> {
    Ok(fiber
        .map(|fiber| store.fiber_arena().get(fiber).map(|node| node.tag()))
        .transpose()?)
}

#[cfg(test)]
pub(super) fn validate_completed_host_root_render_for_complete_work_handoff(
    store: &FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
) -> Result<(), HostRootCompleteWorkHandoffError> {
    let root_id = render.root();
    let scheduling = store.root(root_id)?.scheduling();

    if scheduling.work_in_progress() != Some(render.work_in_progress()) {
        return Err(HostRootCompleteWorkHandoffError::RenderPhaseWorkMismatch {
            root: root_id,
            expected: scheduling.work_in_progress(),
            actual: render.work_in_progress(),
        });
    }

    if scheduling.work_in_progress_root_render_lanes() != render.render_lanes() {
        return Err(HostRootCompleteWorkHandoffError::RenderPhaseLanesMismatch {
            root: root_id,
            expected: scheduling.work_in_progress_root_render_lanes(),
            actual: render.render_lanes(),
        });
    }

    if scheduling.render_exit_status() != RootRenderExitStatus::Completed {
        return Err(HostRootCompleteWorkHandoffError::RenderPhaseNotCompleted {
            root: root_id,
            status: scheduling.render_exit_status(),
        });
    }

    Ok(())
}
