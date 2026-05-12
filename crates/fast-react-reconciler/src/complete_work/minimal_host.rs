use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    FiberFlags, FiberId, FiberTag, FiberTopologyError, Lanes, StateNodeHandle, bubble_properties,
};
use fast_react_host_config::{
    DetachedHostChild, HostCreation, HostError, HostFiberTokenPhase, HostFiberTokenRef,
    HostFiberTokenTarget, HostTypes, InitialChildrenFinalization,
};

use crate::host_nodes::{HostNodeScope, HostNodeStore, HostNodeValidationError};
use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostFiberTokenId,
    HostFiberTokenValidationError,
};

pub(crate) trait HostFiberTokenFactory<H: HostTypes> {
    fn create_host_fiber_token(&mut self, token_id: HostFiberTokenId) -> H::HostFiberToken;
}

#[derive(Debug, Clone, Copy)]
pub(crate) struct MinimalHostRootCompleteWorkRequest<'a, H: HostTypes> {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    component_type: &'a H::Type,
    component_props: &'a H::Props,
    text: &'a str,
}

impl<'a, H: HostTypes> MinimalHostRootCompleteWorkRequest<'a, H> {
    #[must_use]
    pub(crate) const fn new(
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        component_type: &'a H::Type,
        component_props: &'a H::Props,
        text: &'a str,
    ) -> Self {
        Self {
            root,
            host_root_work_in_progress,
            component_type,
            component_props,
            text,
        }
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(crate) const fn component_type(&self) -> &'a H::Type {
        self.component_type
    }

    #[must_use]
    pub(crate) const fn component_props(&self) -> &'a H::Props {
        self.component_props
    }

    #[must_use]
    pub(crate) const fn text(&self) -> &'a str {
        self.text
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct MinimalHostRootCompleteWorkRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    component: FiberId,
    text: FiberId,
    component_state_node: StateNodeHandle,
    text_state_node: StateNodeHandle,
    component_scope: HostNodeScope,
    text_scope: HostNodeScope,
    component_finalization: InitialChildrenFinalization,
}

impl MinimalHostRootCompleteWorkRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(crate) const fn component(self) -> FiberId {
        self.component
    }

    #[must_use]
    pub(crate) const fn text(self) -> FiberId {
        self.text
    }

    #[must_use]
    pub(crate) const fn component_state_node(self) -> StateNodeHandle {
        self.component_state_node
    }

    #[must_use]
    pub(crate) const fn text_state_node(self) -> StateNodeHandle {
        self.text_state_node
    }

    #[must_use]
    pub(crate) const fn component_scope(self) -> HostNodeScope {
        self.component_scope
    }

    #[must_use]
    pub(crate) const fn text_scope(self) -> HostNodeScope {
        self.text_scope
    }

    #[must_use]
    pub(crate) const fn component_finalization(self) -> InitialChildrenFinalization {
        self.component_finalization
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum MinimalHostCompleteWorkError {
    RootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    Host(HostError),
    HostFiberToken(HostFiberTokenValidationError),
    HostNode(HostNodeValidationError),
    StaleHostRootWorkInProgress {
        root: FiberRootId,
        current: FiberId,
        work_in_progress: FiberId,
        current_alternate: Option<FiberId>,
        work_in_progress_alternate: Option<FiberId>,
    },
    ExpectedFiberTag {
        fiber: FiberId,
        expected: FiberTag,
        actual: FiberTag,
    },
    ChildCountMismatch {
        parent: FiberId,
        expected: usize,
        actual: usize,
    },
    UnsupportedRootTextChild {
        host_root: FiberId,
        text: FiberId,
    },
    UnsupportedComponentChildTag {
        component: FiberId,
        child: FiberId,
        actual: FiberTag,
    },
    ShouldSetTextContentWithHostTextChild {
        component: FiberId,
        text: FiberId,
    },
    PreexistingStateNode {
        fiber: FiberId,
        tag: FiberTag,
        state_node: StateNodeHandle,
    },
}

impl Display for MinimalHostCompleteWorkError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::RootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::Host(error) => Display::fmt(error, formatter),
            Self::HostFiberToken(error) => Display::fmt(error, formatter),
            Self::HostNode(error) => Display::fmt(error, formatter),
            Self::StaleHostRootWorkInProgress {
                root,
                current,
                work_in_progress,
                current_alternate,
                work_in_progress_alternate,
            } => write!(
                formatter,
                "HostRoot work-in-progress {} is stale for root {} current {}; current alternate {:?}, work-in-progress alternate {:?}",
                work_in_progress.slot().get(),
                root.raw(),
                current.slot().get(),
                current_alternate.map(|fiber| fiber.slot().get()),
                work_in_progress_alternate.map(|fiber| fiber.slot().get())
            ),
            Self::ExpectedFiberTag {
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "fiber {} must be {:?}, found {:?}",
                fiber.slot().get(),
                expected,
                actual
            ),
            Self::ChildCountMismatch {
                parent,
                expected,
                actual,
            } => write!(
                formatter,
                "fiber {} must have {} child records for minimal complete work, found {}",
                parent.slot().get(),
                expected,
                actual
            ),
            Self::UnsupportedRootTextChild { host_root, text } => write!(
                formatter,
                "HostRoot {} cannot complete direct HostText child {} in the minimal host path",
                host_root.slot().get(),
                text.slot().get()
            ),
            Self::UnsupportedComponentChildTag {
                component,
                child,
                actual,
            } => write!(
                formatter,
                "HostComponent {} cannot complete child {} with tag {:?} in the minimal host path",
                component.slot().get(),
                child.slot().get(),
                actual
            ),
            Self::ShouldSetTextContentWithHostTextChild { component, text } => write!(
                formatter,
                "HostComponent {} asked to set text content directly but still has HostText child {}",
                component.slot().get(),
                text.slot().get()
            ),
            Self::PreexistingStateNode {
                fiber,
                tag,
                state_node,
            } => write!(
                formatter,
                "fiber {} ({:?}) already has state node {} before minimal host complete work",
                fiber.slot().get(),
                tag,
                state_node.raw()
            ),
        }
    }
}

impl Error for MinimalHostCompleteWorkError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::RootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::Host(error) => Some(error),
            Self::HostFiberToken(error) => Some(error),
            Self::HostNode(error) => Some(error),
            Self::StaleHostRootWorkInProgress { .. }
            | Self::ExpectedFiberTag { .. }
            | Self::ChildCountMismatch { .. }
            | Self::UnsupportedRootTextChild { .. }
            | Self::UnsupportedComponentChildTag { .. }
            | Self::ShouldSetTextContentWithHostTextChild { .. }
            | Self::PreexistingStateNode { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for MinimalHostCompleteWorkError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::RootStore(error)
    }
}

impl From<FiberTopologyError> for MinimalHostCompleteWorkError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<HostError> for MinimalHostCompleteWorkError {
    fn from(error: HostError) -> Self {
        Self::Host(error)
    }
}

impl From<HostFiberTokenValidationError> for MinimalHostCompleteWorkError {
    fn from(error: HostFiberTokenValidationError) -> Self {
        Self::HostFiberToken(error)
    }
}

impl From<HostNodeValidationError> for MinimalHostCompleteWorkError {
    fn from(error: HostNodeValidationError) -> Self {
        Self::HostNode(error)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct MinimalHostRootComponentTextShape {
    component: FiberId,
    text: FiberId,
}

pub(crate) fn complete_minimal_host_root_component_text<H, T>(
    store: &mut FiberRootStore<H>,
    host: &mut H,
    host_nodes: &mut HostNodeStore<H>,
    token_factory: &mut T,
    request: MinimalHostRootCompleteWorkRequest<'_, H>,
) -> Result<MinimalHostRootCompleteWorkRecord, MinimalHostCompleteWorkError>
where
    H: HostCreation,
    T: HostFiberTokenFactory<H>,
{
    let shape = validate_minimal_host_root_component_text_shape(store, &request)?;
    let root_context = {
        let container = store.root(request.root())?.container_info();
        host.root_host_context(container)?
    };
    let component_context = host.child_host_context(
        &root_context,
        request.component_type(),
        request.component_props(),
    )?;
    if host.should_set_text_content(
        request.component_type(),
        request.component_props(),
        &root_context,
    ) {
        return Err(
            MinimalHostCompleteWorkError::ShouldSetTextContentWithHostTextChild {
                component: shape.component,
                text: shape.text,
            },
        );
    }

    let text_scope = issue_creation_host_node_scope(
        store,
        request.root(),
        shape.text,
        HostFiberTokenTarget::TextInstance,
    )?;
    let text_token = token_factory.create_host_fiber_token(text_scope.token_id());
    let text_instance = {
        let container = store.root(request.root())?.container_info();
        host.create_text_instance(
            HostFiberTokenRef::new(
                &text_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            request.text(),
            container,
            &component_context,
        )?
    };

    let component_scope = issue_creation_host_node_scope(
        store,
        request.root(),
        shape.component,
        HostFiberTokenTarget::Instance,
    )?;
    let component_token = token_factory.create_host_fiber_token(component_scope.token_id());
    let mut instance = {
        let container = store.root(request.root())?.container_info();
        host.create_instance(
            HostFiberTokenRef::new(
                &component_token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            ),
            request.component_type(),
            request.component_props(),
            container,
            &root_context,
        )?
    };
    {
        host.append_detached_initial_child(&mut instance, DetachedHostChild::text(&text_instance))?;
    }
    let component_finalization = {
        let container = store.root(request.root())?.container_info();
        host.finalize_initial_children(
            &mut instance,
            request.component_type(),
            request.component_props(),
            container,
            &root_context,
        )?
    };

    let text_state_node = host_nodes.insert_text(text_scope, text_instance);
    complete_fiber_common(
        store,
        shape.text,
        text_state_node,
        InitialChildrenFinalization::NoCommitMount,
    )?;
    let component_state_node = host_nodes.insert_instance(component_scope, instance);
    complete_fiber_common(
        store,
        shape.component,
        component_state_node,
        component_finalization,
    )?;
    complete_host_root(store, request.host_root_work_in_progress())?;

    Ok(MinimalHostRootCompleteWorkRecord {
        root: request.root(),
        host_root_work_in_progress: request.host_root_work_in_progress(),
        component: shape.component,
        text: shape.text,
        component_state_node,
        text_state_node,
        component_scope,
        text_scope,
        component_finalization,
    })
}

fn validate_minimal_host_root_component_text_shape<H: HostTypes>(
    store: &FiberRootStore<H>,
    request: &MinimalHostRootCompleteWorkRequest<'_, H>,
) -> Result<MinimalHostRootComponentTextShape, MinimalHostCompleteWorkError> {
    let current = store.root(request.root())?.current();
    let arena = store.fiber_arena();
    let current_node = arena.get(current)?;
    let work_in_progress_node = arena.get(request.host_root_work_in_progress())?;
    expect_tag(current, current_node.tag(), FiberTag::HostRoot)?;
    expect_tag(
        request.host_root_work_in_progress(),
        work_in_progress_node.tag(),
        FiberTag::HostRoot,
    )?;

    if current_node.alternate() != Some(request.host_root_work_in_progress())
        || work_in_progress_node.alternate() != Some(current)
    {
        return Err(MinimalHostCompleteWorkError::StaleHostRootWorkInProgress {
            root: request.root(),
            current,
            work_in_progress: request.host_root_work_in_progress(),
            current_alternate: current_node.alternate(),
            work_in_progress_alternate: work_in_progress_node.alternate(),
        });
    }
    arena.validate_alternate_pair(current, request.host_root_work_in_progress())?;

    let root_children = arena.child_ids(request.host_root_work_in_progress())?;
    let component = expect_exact_child(request.host_root_work_in_progress(), &root_children)?;
    let component_node = arena.get(component)?;
    if component_node.tag() == FiberTag::HostText {
        return Err(MinimalHostCompleteWorkError::UnsupportedRootTextChild {
            host_root: request.host_root_work_in_progress(),
            text: component,
        });
    }
    expect_tag(component, component_node.tag(), FiberTag::HostComponent)?;
    reject_preexisting_state_node(component, component_node.tag(), component_node.state_node())?;

    let component_children = arena.child_ids(component)?;
    let text = expect_exact_child(component, &component_children)?;
    let text_node = arena.get(text)?;
    if text_node.tag() != FiberTag::HostText {
        return Err(MinimalHostCompleteWorkError::UnsupportedComponentChildTag {
            component,
            child: text,
            actual: text_node.tag(),
        });
    }
    reject_preexisting_state_node(text, text_node.tag(), text_node.state_node())?;
    let text_children = arena.child_ids(text)?;
    expect_no_children(text, &text_children)?;

    Ok(MinimalHostRootComponentTextShape { component, text })
}

fn expect_exact_child(
    parent: FiberId,
    children: &[FiberId],
) -> Result<FiberId, MinimalHostCompleteWorkError> {
    match children {
        [child] => Ok(*child),
        _ => Err(MinimalHostCompleteWorkError::ChildCountMismatch {
            parent,
            expected: 1,
            actual: children.len(),
        }),
    }
}

fn expect_no_children(
    parent: FiberId,
    children: &[FiberId],
) -> Result<(), MinimalHostCompleteWorkError> {
    if children.is_empty() {
        Ok(())
    } else {
        Err(MinimalHostCompleteWorkError::ChildCountMismatch {
            parent,
            expected: 0,
            actual: children.len(),
        })
    }
}

fn expect_tag(
    fiber: FiberId,
    actual: FiberTag,
    expected: FiberTag,
) -> Result<(), MinimalHostCompleteWorkError> {
    if actual == expected {
        Ok(())
    } else {
        Err(MinimalHostCompleteWorkError::ExpectedFiberTag {
            fiber,
            expected,
            actual,
        })
    }
}

fn reject_preexisting_state_node(
    fiber: FiberId,
    tag: FiberTag,
    state_node: StateNodeHandle,
) -> Result<(), MinimalHostCompleteWorkError> {
    if state_node.is_none() {
        Ok(())
    } else {
        Err(MinimalHostCompleteWorkError::PreexistingStateNode {
            fiber,
            tag,
            state_node,
        })
    }
}

fn issue_creation_host_node_scope<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    fiber: FiberId,
    target: HostFiberTokenTarget,
) -> Result<HostNodeScope, MinimalHostCompleteWorkError> {
    let token_id =
        store
            .host_tokens_mut()
            .issue(root_id, fiber, HostFiberTokenPhase::Creation, target);
    store.host_tokens().validate(
        token_id,
        root_id,
        fiber,
        HostFiberTokenPhase::Creation,
        target,
    )?;
    Ok(HostNodeScope::new(
        root_id,
        fiber,
        token_id,
        HostFiberTokenPhase::Creation,
    ))
}

fn complete_fiber_common<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    fiber: FiberId,
    state_node: StateNodeHandle,
    finalization: InitialChildrenFinalization,
) -> Result<(), MinimalHostCompleteWorkError> {
    let memoized_props = store.fiber_arena().get(fiber)?.pending_props();
    let bubbled = bubble_properties(store.fiber_arena(), fiber)?;
    let node = store.fiber_arena_mut().get_mut(fiber)?;
    node.set_lanes(Lanes::NO);
    node.set_state_node(state_node);
    node.set_memoized_props(memoized_props);
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
    if matches!(finalization, InitialChildrenFinalization::CommitMount) {
        node.merge_flags(FiberFlags::UPDATE);
    }
    Ok(())
}

fn complete_host_root<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    fiber: FiberId,
) -> Result<(), MinimalHostCompleteWorkError> {
    let bubbled = bubble_properties(store.fiber_arena(), fiber)?;
    let node = store.fiber_arena_mut().get_mut(fiber)?;
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use fast_react_core::{FiberMode, PropsHandle};
    use fast_react_host_config::{
        HostCapability, HostCapabilitySet, HostChild, HostHandleKind, HostIdentityAndContext,
        HostOperationError, HostResult,
    };

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct TestContainer(u64);

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct TestProps;

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct TestHostContext {
        depth: u8,
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    struct TestInstance {
        token: HostFiberTokenId,
        ty: &'static str,
        children: Vec<TestChild>,
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    struct TestTextInstance {
        token: HostFiberTokenId,
        text: String,
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    enum TestChild {
        Instance(&'static str),
        Text(String),
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    enum MinimalHostFailure {
        CreateInstance,
        AppendInitialChild,
        FinalizeInitialChildren,
    }

    #[derive(Debug, Clone)]
    struct TestHost {
        operations: Vec<&'static str>,
        should_set_text_content: bool,
        reject_empty_token: bool,
        finalization: InitialChildrenFinalization,
        fail_at: Option<MinimalHostFailure>,
    }

    impl Default for TestHost {
        fn default() -> Self {
            Self {
                operations: Vec::new(),
                should_set_text_content: false,
                reject_empty_token: true,
                finalization: InitialChildrenFinalization::NoCommitMount,
                fail_at: None,
            }
        }
    }

    impl TestHost {
        fn record(&mut self, operation: &'static str) {
            self.operations.push(operation);
        }

        fn reject_invalid_token(&self, token: HostFiberTokenRef<'_, Self>) -> HostResult<()> {
            if self.reject_empty_token && token.token().is_none() {
                Err(HostOperationError::invalid_fiber_token(
                    self.renderer_name(),
                    token.phase(),
                    token.target(),
                    fast_react_host_config::HostFiberTokenViolation::Invalid,
                )
                .into())
            } else {
                Ok(())
            }
        }

        fn configured_failure(&self, failure: MinimalHostFailure) -> HostResult<()> {
            if self.fail_at == Some(failure) {
                Err(HostOperationError::invalid_handle(
                    self.renderer_name(),
                    HostHandleKind::Instance,
                )
                .into())
            } else {
                Ok(())
            }
        }
    }

    impl HostTypes for TestHost {
        type HostFiberToken = HostFiberTokenId;
        type Type = &'static str;
        type Props = TestProps;
        type Container = TestContainer;
        type Instance = TestInstance;
        type TextInstance = TestTextInstance;
        type PublicInstance = ();
        type HostContext = TestHostContext;
        type UpdatePayload = ();
        type TimeoutHandle = ();
        type NoTimeout = ();
        type CommitState = ();
        type EventPriority = ();
        type EventType = ();
        type EventTimestamp = ();
        type ActivityInstance = ();
        type SuspenseInstance = ();
        type HydratableInstance = ();
        type FormInstance = ();
        type ChildSet = ();
        type Resource = ();
        type HoistableRoot = ();
        type TransitionStatus = ();
        type SuspendedState = ();
        type RunningViewTransition = ();
        type ViewTransitionInstance = ();
        type InstanceMeasurement = ();
        type EventResponder = ();
        type GestureTimeline = ();
        type FragmentInstance = ();
        type RendererInspectionConfig = ();
    }

    impl HostIdentityAndContext for TestHost {
        fn renderer_name(&self) -> &'static str {
            "minimal-complete-work-test-host"
        }

        fn capabilities(&self) -> HostCapabilitySet {
            HostCapabilitySet::empty().with(HostCapability::Mutation)
        }

        fn get_public_instance(
            &self,
            _instance: &Self::Instance,
        ) -> HostResult<Self::PublicInstance> {
            Ok(())
        }

        fn root_host_context(&self, container: &Self::Container) -> HostResult<Self::HostContext> {
            let _container = container;
            Ok(TestHostContext { depth: 0 })
        }

        fn child_host_context(
            &self,
            parent_context: &Self::HostContext,
            _ty: &Self::Type,
            _props: &Self::Props,
        ) -> HostResult<Self::HostContext> {
            Ok(TestHostContext {
                depth: parent_context.depth + 1,
            })
        }
    }

    impl HostCreation for TestHost {
        fn should_set_text_content(
            &self,
            _ty: &Self::Type,
            _props: &Self::Props,
            _context: &Self::HostContext,
        ) -> bool {
            self.should_set_text_content
        }

        fn create_instance(
            &mut self,
            token: HostFiberTokenRef<'_, Self>,
            ty: &Self::Type,
            _props: &Self::Props,
            _container: &Self::Container,
            _context: &Self::HostContext,
        ) -> HostResult<Self::Instance> {
            self.record("create_instance");
            self.reject_invalid_token(token)?;
            self.configured_failure(MinimalHostFailure::CreateInstance)?;
            Ok(TestInstance {
                token: *token.token(),
                ty: *ty,
                children: Vec::new(),
            })
        }

        fn create_text_instance(
            &mut self,
            token: HostFiberTokenRef<'_, Self>,
            text: &str,
            _container: &Self::Container,
            _context: &Self::HostContext,
        ) -> HostResult<Self::TextInstance> {
            self.record("create_text_instance");
            self.reject_invalid_token(token)?;
            Ok(TestTextInstance {
                token: *token.token(),
                text: text.to_owned(),
            })
        }

        fn append_initial_child(
            &mut self,
            parent: &mut Self::Instance,
            child: HostChild<'_, Self>,
        ) -> HostResult<()> {
            self.record("append_initial_child");
            self.configured_failure(MinimalHostFailure::AppendInitialChild)?;
            match child {
                HostChild::Instance(instance) => {
                    parent.children.push(TestChild::Instance(instance.ty));
                }
                HostChild::Text(text) => {
                    parent.children.push(TestChild::Text(text.text.clone()));
                }
            }
            Ok(())
        }

        fn finalize_initial_children(
            &mut self,
            _instance: &mut Self::Instance,
            _ty: &Self::Type,
            _props: &Self::Props,
            _container: &Self::Container,
            _context: &Self::HostContext,
        ) -> HostResult<InitialChildrenFinalization> {
            self.record("finalize_initial_children");
            self.configured_failure(MinimalHostFailure::FinalizeInitialChildren)?;
            Ok(self.finalization)
        }

        fn clone_mutable_instance(
            &mut self,
            instance: &Self::Instance,
            _update_payload: Option<&Self::UpdatePayload>,
        ) -> HostResult<Self::Instance> {
            Ok(instance.clone())
        }

        fn clone_mutable_text_instance(
            &mut self,
            text_instance: &Self::TextInstance,
        ) -> HostResult<Self::TextInstance> {
            Ok(text_instance.clone())
        }
    }

    #[derive(Debug, Default)]
    struct TokenFactory {
        force_empty_token: bool,
    }

    impl HostFiberTokenFactory<TestHost> for TokenFactory {
        fn create_host_fiber_token(&mut self, token_id: HostFiberTokenId) -> HostFiberTokenId {
            if self.force_empty_token {
                HostFiberTokenId::NONE
            } else {
                token_id
            }
        }
    }

    #[derive(Debug, Clone, Copy)]
    struct MinimalTreeFixture {
        root: FiberRootId,
        current: FiberId,
        work_in_progress: FiberId,
        component: FiberId,
        text: FiberId,
    }

    fn minimal_tree() -> (FiberRootStore<TestHost>, MinimalTreeFixture) {
        let mut store = FiberRootStore::<TestHost>::new();
        let root = store
            .create_client_root(TestContainer(1), crate::RootOptions::new())
            .unwrap();
        let current = store.root(root).unwrap().current();
        let work_in_progress =
            crate::create_host_root_work_in_progress(&mut store, root, PropsHandle::from_raw(10))
                .unwrap();
        let component = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(20),
            FiberMode::NO,
        );
        let text = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(30),
            FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .get_mut(component)
            .unwrap()
            .merge_flags(FiberFlags::PLACEMENT);
        store
            .fiber_arena_mut()
            .set_children(work_in_progress, &[component])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(component, &[text])
            .unwrap();

        (
            store,
            MinimalTreeFixture {
                root,
                current,
                work_in_progress,
                component,
                text,
            },
        )
    }

    fn complete_fixture(
        store: &mut FiberRootStore<TestHost>,
        fixture: MinimalTreeFixture,
        host: &mut TestHost,
        host_nodes: &mut HostNodeStore<TestHost>,
        token_factory: &mut TokenFactory,
    ) -> Result<MinimalHostRootCompleteWorkRecord, MinimalHostCompleteWorkError> {
        let props = TestProps;
        complete_minimal_host_root_component_text(
            store,
            host,
            host_nodes,
            token_factory,
            MinimalHostRootCompleteWorkRequest::new(
                fixture.root,
                fixture.work_in_progress,
                &"div",
                &props,
                "text",
            ),
        )
    }

    fn assert_no_published_host_completion(
        store: &FiberRootStore<TestHost>,
        host_nodes: &HostNodeStore<TestHost>,
        fixture: MinimalTreeFixture,
    ) {
        assert!(host_nodes.is_empty());
        assert_eq!(
            store
                .fiber_arena()
                .get(fixture.component)
                .unwrap()
                .state_node(),
            StateNodeHandle::NONE
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(fixture.component)
                .unwrap()
                .memoized_props(),
            PropsHandle::NONE
        );
        assert_eq!(
            store.fiber_arena().get(fixture.text).unwrap().state_node(),
            StateNodeHandle::NONE
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(fixture.text)
                .unwrap()
                .memoized_props(),
            PropsHandle::NONE
        );
    }

    #[test]
    fn complete_work_minimal_host_root_component_text_creates_detached_host_records() {
        let (mut store, fixture) = minimal_tree();
        let mut host = TestHost::default();
        let mut host_nodes = HostNodeStore::<TestHost>::new();
        let mut token_factory = TokenFactory::default();

        let record = complete_fixture(
            &mut store,
            fixture,
            &mut host,
            &mut host_nodes,
            &mut token_factory,
        )
        .unwrap();

        assert_eq!(record.root(), fixture.root);
        assert_eq!(
            record.host_root_work_in_progress(),
            fixture.work_in_progress
        );
        assert_eq!(record.component(), fixture.component);
        assert_eq!(record.text(), fixture.text);
        assert_eq!(host_nodes.instance_count(), 1);
        assert_eq!(host_nodes.text_count(), 1);
        assert!(!record.public_dom_compatibility_claimed());

        let text = host_nodes
            .text(record.text_state_node(), record.text_scope())
            .unwrap();
        assert_eq!(text.text, "text");
        assert_eq!(text.token, record.text_scope().token_id());
        let instance = host_nodes
            .instance(record.component_state_node(), record.component_scope())
            .unwrap();
        assert_eq!(instance.ty, "div");
        assert_eq!(instance.token, record.component_scope().token_id());
        assert_eq!(instance.children, vec![TestChild::Text("text".to_owned())]);

        let component_node = store.fiber_arena().get(fixture.component).unwrap();
        assert_eq!(component_node.state_node(), record.component_state_node());
        assert_eq!(component_node.memoized_props(), PropsHandle::from_raw(20));
        assert_eq!(component_node.lanes(), Lanes::NO);
        assert!(component_node.flags().contains_all(FiberFlags::PLACEMENT));
        let text_node = store.fiber_arena().get(fixture.text).unwrap();
        assert_eq!(text_node.state_node(), record.text_state_node());
        assert_eq!(text_node.memoized_props(), PropsHandle::from_raw(30));
        assert_eq!(
            store
                .fiber_arena()
                .get(fixture.work_in_progress)
                .unwrap()
                .subtree_flags(),
            FiberFlags::PLACEMENT
        );
        assert_eq!(
            host.operations,
            vec![
                "create_text_instance",
                "create_instance",
                "append_initial_child",
                "finalize_initial_children"
            ]
        );
    }

    #[test]
    fn complete_work_minimal_host_failure_after_text_creation_leaves_no_published_state() {
        for (failure, expected_operations) in [
            (
                MinimalHostFailure::CreateInstance,
                vec!["create_text_instance", "create_instance"],
            ),
            (
                MinimalHostFailure::AppendInitialChild,
                vec![
                    "create_text_instance",
                    "create_instance",
                    "append_initial_child",
                ],
            ),
            (
                MinimalHostFailure::FinalizeInitialChildren,
                vec![
                    "create_text_instance",
                    "create_instance",
                    "append_initial_child",
                    "finalize_initial_children",
                ],
            ),
        ] {
            let (mut store, fixture) = minimal_tree();
            let mut host = TestHost {
                fail_at: Some(failure),
                ..TestHost::default()
            };
            let mut host_nodes = HostNodeStore::<TestHost>::new();
            let mut token_factory = TokenFactory::default();

            let error = complete_fixture(
                &mut store,
                fixture,
                &mut host,
                &mut host_nodes,
                &mut token_factory,
            )
            .unwrap_err();

            assert!(matches!(error, MinimalHostCompleteWorkError::Host(_)));
            assert_eq!(host.operations, expected_operations);
            assert_no_published_host_completion(&store, &host_nodes, fixture);

            let mut retry_host = TestHost::default();
            let mut retry_token_factory = TokenFactory::default();
            let retry_record = complete_fixture(
                &mut store,
                fixture,
                &mut retry_host,
                &mut host_nodes,
                &mut retry_token_factory,
            )
            .unwrap();
            assert_eq!(retry_record.component(), fixture.component);
            assert_eq!(retry_record.text(), fixture.text);
            assert_eq!(host_nodes.instance_count(), 1);
            assert_eq!(host_nodes.text_count(), 1);
        }
    }

    #[test]
    fn complete_work_minimal_host_root_rejects_root_text_child() {
        let (mut store, fixture) = minimal_tree();
        store
            .fiber_arena_mut()
            .set_children(fixture.component, &[])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(fixture.work_in_progress, &[fixture.text])
            .unwrap();
        let mut host = TestHost::default();
        let mut host_nodes = HostNodeStore::<TestHost>::new();
        let mut token_factory = TokenFactory::default();

        let error = complete_fixture(
            &mut store,
            fixture,
            &mut host,
            &mut host_nodes,
            &mut token_factory,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            MinimalHostCompleteWorkError::UnsupportedRootTextChild { .. }
        ));
        assert!(host_nodes.is_empty());
    }

    #[test]
    fn complete_work_minimal_host_root_rejects_missing_extra_and_nested_children() {
        let (mut missing_store, missing) = minimal_tree();
        missing_store
            .fiber_arena_mut()
            .set_children(missing.component, &[])
            .unwrap();
        let mut host = TestHost::default();
        let mut host_nodes = HostNodeStore::<TestHost>::new();
        let mut token_factory = TokenFactory::default();
        assert!(matches!(
            complete_fixture(
                &mut missing_store,
                missing,
                &mut host,
                &mut host_nodes,
                &mut token_factory,
            )
            .unwrap_err(),
            MinimalHostCompleteWorkError::ChildCountMismatch {
                parent,
                expected: 1,
                actual: 0,
            } if parent == missing.component
        ));

        let (mut extra_store, extra) = minimal_tree();
        let extra_text = extra_store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(31),
            FiberMode::NO,
        );
        extra_store
            .fiber_arena_mut()
            .set_children(extra.component, &[extra.text, extra_text])
            .unwrap();
        let mut host = TestHost::default();
        let mut host_nodes = HostNodeStore::<TestHost>::new();
        let mut token_factory = TokenFactory::default();
        assert!(matches!(
            complete_fixture(
                &mut extra_store,
                extra,
                &mut host,
                &mut host_nodes,
                &mut token_factory,
            )
            .unwrap_err(),
            MinimalHostCompleteWorkError::ChildCountMismatch {
                parent,
                expected: 1,
                actual: 2,
            } if parent == extra.component
        ));

        let (mut nested_store, nested) = minimal_tree();
        let nested_component = nested_store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(40),
            FiberMode::NO,
        );
        nested_store
            .fiber_arena_mut()
            .set_children(nested.component, &[nested_component])
            .unwrap();
        let mut host = TestHost::default();
        let mut host_nodes = HostNodeStore::<TestHost>::new();
        let mut token_factory = TokenFactory::default();
        assert!(matches!(
            complete_fixture(
                &mut nested_store,
                nested,
                &mut host,
                &mut host_nodes,
                &mut token_factory,
            )
            .unwrap_err(),
            MinimalHostCompleteWorkError::UnsupportedComponentChildTag {
                child,
                actual: FiberTag::HostComponent,
                ..
            } if child == nested_component
        ));
    }

    #[test]
    fn complete_work_minimal_host_rejects_should_set_text_content_with_host_text_child() {
        let (mut store, fixture) = minimal_tree();
        let mut host = TestHost {
            should_set_text_content: true,
            ..TestHost::default()
        };
        let mut host_nodes = HostNodeStore::<TestHost>::new();
        let mut token_factory = TokenFactory::default();

        let error = complete_fixture(
            &mut store,
            fixture,
            &mut host,
            &mut host_nodes,
            &mut token_factory,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            MinimalHostCompleteWorkError::ShouldSetTextContentWithHostTextChild { .. }
        ));
        assert!(host_nodes.is_empty());
    }

    #[test]
    fn complete_work_minimal_host_rejects_preexisting_state_node() {
        let (mut store, fixture) = minimal_tree();
        store
            .fiber_arena_mut()
            .get_mut(fixture.text)
            .unwrap()
            .set_state_node(StateNodeHandle::from_raw(99));
        let mut host = TestHost::default();
        let mut host_nodes = HostNodeStore::<TestHost>::new();
        let mut token_factory = TokenFactory::default();

        let error = complete_fixture(
            &mut store,
            fixture,
            &mut host,
            &mut host_nodes,
            &mut token_factory,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            MinimalHostCompleteWorkError::PreexistingStateNode {
                fiber,
                tag: FiberTag::HostText,
                state_node,
            } if fiber == fixture.text && state_node == StateNodeHandle::from_raw(99)
        ));
        assert!(host_nodes.is_empty());
    }

    #[test]
    fn complete_work_minimal_host_rejects_stale_host_root_work_in_progress() {
        let (mut store, fixture) = minimal_tree();
        let foreign_root = store
            .create_client_root(TestContainer(2), crate::RootOptions::new())
            .unwrap();
        let foreign_work_in_progress = crate::create_host_root_work_in_progress(
            &mut store,
            foreign_root,
            PropsHandle::from_raw(50),
        )
        .unwrap();
        let mut host = TestHost::default();
        let mut host_nodes = HostNodeStore::<TestHost>::new();
        let mut token_factory = TokenFactory::default();
        let props = TestProps;

        let error = complete_minimal_host_root_component_text(
            &mut store,
            &mut host,
            &mut host_nodes,
            &mut token_factory,
            MinimalHostRootCompleteWorkRequest::new(
                fixture.root,
                foreign_work_in_progress,
                &"div",
                &props,
                "text",
            ),
        )
        .unwrap_err();

        assert!(matches!(
            error,
            MinimalHostCompleteWorkError::StaleHostRootWorkInProgress {
                root,
                current,
                work_in_progress,
                ..
            } if root == fixture.root
                && current == fixture.current
                && work_in_progress == foreign_work_in_progress
        ));
        assert!(host_nodes.is_empty());
    }

    #[test]
    fn complete_work_minimal_host_surfaces_renderer_token_rejection() {
        let (mut store, fixture) = minimal_tree();
        let mut host = TestHost::default();
        let mut host_nodes = HostNodeStore::<TestHost>::new();
        let mut token_factory = TokenFactory {
            force_empty_token: true,
        };

        let error = complete_fixture(
            &mut store,
            fixture,
            &mut host,
            &mut host_nodes,
            &mut token_factory,
        )
        .unwrap_err();

        assert!(matches!(error, MinimalHostCompleteWorkError::Host(_)));
        assert!(host_nodes.is_empty());
    }
}
