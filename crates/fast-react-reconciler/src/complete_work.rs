//! Private test-only complete/unwind helpers.
//!
//! These helpers model only the Provider stack restoration point and narrow
//! HostRoot child-set completion points needed by root-loop canaries. They do
//! not implement general complete-work traversal, public arrays, keyed
//! children, portals, Suspense, commit, renderer output, or public container
//! compatibility.

#![cfg(test)]
#![allow(dead_code)]

use std::collections::HashSet;
use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    ContextHandle, ContextStackError, ContextStackSnapshot, ContextValueHandle, DeletionListId,
    FiberArena, FiberFlags, FiberId, FiberTag, FiberTopologyError, Lanes, PropsHandle,
    StateNodeHandle, bubble_properties,
};

use crate::FiberRootId;
use crate::begin_work::{
    ContextProviderUseContextOpenScopeBeginWorkRecord, UnsupportedOffscreenChildShapeKind,
    UnsupportedOffscreenChildShapeRecord, UnsupportedOffscreenVisibility,
    UnsupportedOffscreenVisibilityChildTraversalBlocker,
    UnsupportedOffscreenVisibilityTransitionKind, UnsupportedOffscreenVisibilityTransitionRecord,
    unsupported_offscreen_visibility_transition_record,
};
use crate::function_component::FunctionComponentContextRenderStore;
use crate::unsupported_features::OFFSCREEN_UNSUPPORTED_FEATURE;

mod append_all_children;
mod context_provider;
mod host_component_update;
mod host_root_child_set;
mod managed_child;
mod offscreen_visibility;

pub(crate) use append_all_children::*;
pub(crate) use context_provider::*;
pub(crate) use host_component_update::*;
pub(crate) use host_root_child_set::*;
pub(crate) use managed_child::*;
pub(crate) use offscreen_visibility::*;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::begin_work::{
        BeginWorkError, BeginWorkRequest, ContextProviderBeginWorkRequest,
        UnsupportedOffscreenVisibility, UnsupportedOffscreenVisibilityChildTraversalBlocker,
        UnsupportedOffscreenVisibilityMode, UnsupportedOffscreenVisibilityTransitionKind,
        begin_work, begin_work_context_provider_use_context_child_for_complete_traversal,
    };
    use crate::function_component::{
        FunctionComponentContextConsumerInvoker, FunctionComponentContextRenderReader,
        FunctionComponentInvocationError, FunctionComponentInvocationRequest,
        FunctionComponentInvoker, FunctionComponentOutputHandle, FunctionComponentRenderError,
    };
    use fast_react_core::{
        FiberMode, FiberTypeHandle, Lane, PropsHandle, ReactKey, StateHandle, StateNodeHandle,
    };

    fn context_value(raw: u64) -> ContextValueHandle {
        ContextValueHandle::from_raw(raw)
    }

    #[derive(Debug)]
    struct TestUseContextInvoker {
        component: FiberTypeHandle,
        context: ContextHandle,
    }

    #[derive(Debug)]
    struct UnexpectedFunctionComponentInvoker;

    impl FunctionComponentInvoker for UnexpectedFunctionComponentInvoker {
        fn invoke_function_component(
            &mut self,
            _request: FunctionComponentInvocationRequest,
        ) -> Result<FunctionComponentOutputHandle, FunctionComponentInvocationError> {
            Err(FunctionComponentInvocationError::component_error(
                "unexpected function component invocation for complete-work Offscreen test",
            ))
        }
    }

    impl FunctionComponentContextConsumerInvoker for TestUseContextInvoker {
        fn invoke_function_component_context_consumer(
            &mut self,
            request: FunctionComponentInvocationRequest,
            reader: &mut FunctionComponentContextRenderReader<'_>,
        ) -> Result<FunctionComponentOutputHandle, FunctionComponentRenderError> {
            if request.component() != self.component {
                return Err(FunctionComponentRenderError::Invocation {
                    fiber: request.fiber(),
                    component: request.component(),
                    error: FunctionComponentInvocationError::component_error(
                        "missing complete-work provider test component",
                    ),
                });
            }

            let read = reader.use_context(self.context)?;
            Ok(FunctionComponentOutputHandle::from_raw(read.value().raw()))
        }
    }

    fn provider_scope() -> (
        FiberArena,
        FunctionComponentContextRenderStore,
        ContextProviderUseContextOpenScopeBeginWorkRecord,
        ContextValueHandle,
    ) {
        let mut arena = FiberArena::new();
        let provider = arena.create_fiber(
            FiberTag::ContextProvider,
            None,
            PropsHandle::from_raw(1),
            FiberMode::NO,
        );
        let child_current = arena.create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(2),
            FiberMode::NO,
        );
        let component = FiberTypeHandle::from_raw(3);
        arena
            .get_mut(child_current)
            .unwrap()
            .set_fiber_type(component);
        let child = arena
            .create_work_in_progress(child_current, PropsHandle::from_raw(4))
            .unwrap();
        arena.set_children(provider, &[child]).unwrap();
        arena
            .get_mut(child)
            .unwrap()
            .merge_flags(FiberFlags::PLACEMENT);

        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(10);
        let provided_value = context_value(11);
        let context = context_store.create_context(default_value);
        let mut invoker = TestUseContextInvoker { component, context };
        let begin_work = begin_work_context_provider_use_context_child_for_complete_traversal(
            &mut arena,
            ContextProviderBeginWorkRequest::new(provider, Lanes::DEFAULT, context, provided_value),
            &mut context_store,
            &mut invoker,
        )
        .unwrap();

        (arena, context_store, begin_work, default_value)
    }

    #[allow(
        clippy::too_many_arguments,
        reason = "test fixture builder spells out each transition lane/state dimension"
    )]
    fn offscreen_complete_transition_pair(
        key: &'static str,
        previous_hidden_state: StateHandle,
        current_hidden_state: StateHandle,
        previous_lanes: Lanes,
        previous_child_lanes: Lanes,
        work_in_progress_lanes: Lanes,
        work_in_progress_child_lanes: Lanes,
        second_child: bool,
    ) -> (FiberArena, FiberId, FiberId, FiberId, Option<FiberId>) {
        let mut arena = FiberArena::new();
        let previous = arena.create_fiber(
            FiberTag::Offscreen,
            Some(ReactKey::from_normalized(key)),
            PropsHandle::from_raw(900),
            FiberMode::CONCURRENT,
        );
        {
            let node = arena.get_mut(previous).unwrap();
            node.set_memoized_state(previous_hidden_state);
            node.set_lanes(previous_lanes);
            node.set_child_lanes(previous_child_lanes);
        }
        let work_in_progress = arena
            .create_work_in_progress(previous, PropsHandle::from_raw(901))
            .unwrap();
        {
            let node = arena.get_mut(work_in_progress).unwrap();
            node.set_memoized_state(current_hidden_state);
            node.set_lanes(work_in_progress_lanes);
            node.set_child_lanes(work_in_progress_child_lanes);
        }
        let first_child = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(902),
            FiberMode::NO,
        );
        arena
            .get_mut(first_child)
            .unwrap()
            .merge_flags(FiberFlags::PLACEMENT);
        let second_child = if second_child {
            let second_child = arena.create_fiber(
                FiberTag::HostText,
                None,
                PropsHandle::from_raw(903),
                FiberMode::NO,
            );
            arena
                .set_children(work_in_progress, &[first_child, second_child])
                .unwrap();
            Some(second_child)
        } else {
            arena
                .set_children(work_in_progress, &[first_child])
                .unwrap();
            None
        };

        (arena, previous, work_in_progress, first_child, second_child)
    }

    fn offscreen_begin_work_visibility_record(
        arena: &mut FiberArena,
        offscreen: FiberId,
        render_lanes: Lanes,
    ) -> UnsupportedOffscreenChildShapeRecord {
        let mut invoker = UnexpectedFunctionComponentInvoker;
        match begin_work(
            arena,
            BeginWorkRequest::new(offscreen, render_lanes),
            &mut invoker,
        )
        .unwrap_err()
        {
            BeginWorkError::UnsupportedOffscreenChildShape(record) => *record,
            other => panic!("expected Offscreen begin-work visibility record, got {other:?}"),
        }
    }

    #[derive(Debug, Clone, Copy)]
    struct ManagedChildCompleteFixture {
        root: FiberRootId,
        parent_current: FiberId,
        parent_work_in_progress: FiberId,
        child: FiberId,
        order_sibling: Option<FiberId>,
        order_sibling_current: Option<FiberId>,
        parent_state_node: StateNodeHandle,
        child_state_node: StateNodeHandle,
        order_sibling_state_node: StateNodeHandle,
        parent_props: PropsHandle,
        child_props: PropsHandle,
        order_sibling_props: PropsHandle,
        deletion_list: Option<DeletionListId>,
    }

    fn managed_child_placement_complete_fixture() -> (FiberArena, ManagedChildCompleteFixture) {
        let mut arena = FiberArena::new();
        let root = FiberRootId::new(1).unwrap();
        let parent_state_node = StateNodeHandle::from_raw(20_001);
        let child_state_node = StateNodeHandle::from_raw(20_002);
        let parent_props = PropsHandle::from_raw(20_003);
        let child_props = PropsHandle::from_raw(20_004);
        let parent_current =
            arena.create_fiber(FiberTag::HostComponent, None, parent_props, FiberMode::NO);
        {
            let node = arena.get_mut(parent_current).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let parent_work_in_progress = arena
            .create_work_in_progress(parent_current, parent_props)
            .unwrap();
        {
            let node = arena.get_mut(parent_work_in_progress).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let child = arena.create_fiber(FiberTag::HostComponent, None, child_props, FiberMode::NO);
        {
            let node = arena.get_mut(child).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
            node.set_state_node(child_state_node);
            node.set_memoized_props(child_props);
        }
        arena
            .set_children(parent_work_in_progress, &[child])
            .unwrap();

        (
            arena,
            ManagedChildCompleteFixture {
                root,
                parent_current,
                parent_work_in_progress,
                child,
                order_sibling: None,
                order_sibling_current: None,
                parent_state_node,
                child_state_node,
                order_sibling_state_node: StateNodeHandle::NONE,
                parent_props,
                child_props,
                order_sibling_props: PropsHandle::NONE,
                deletion_list: None,
            },
        )
    }

    fn managed_child_delete_complete_fixture() -> (FiberArena, ManagedChildCompleteFixture) {
        let mut arena = FiberArena::new();
        let root = FiberRootId::new(2).unwrap();
        let parent_state_node = StateNodeHandle::from_raw(20_101);
        let child_state_node = StateNodeHandle::from_raw(20_102);
        let parent_props = PropsHandle::from_raw(20_103);
        let child_props = PropsHandle::from_raw(20_104);
        let parent_current =
            arena.create_fiber(FiberTag::HostComponent, None, parent_props, FiberMode::NO);
        {
            let node = arena.get_mut(parent_current).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let child = arena.create_fiber(FiberTag::HostComponent, None, child_props, FiberMode::NO);
        {
            let node = arena.get_mut(child).unwrap();
            node.set_state_node(child_state_node);
            node.set_memoized_props(child_props);
        }
        arena.set_children(parent_current, &[child]).unwrap();

        let parent_work_in_progress = arena
            .create_work_in_progress(parent_current, parent_props)
            .unwrap();
        {
            let node = arena.get_mut(parent_work_in_progress).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let deletion_list = arena
            .mark_child_for_deletion(parent_work_in_progress, child)
            .unwrap();

        (
            arena,
            ManagedChildCompleteFixture {
                root,
                parent_current,
                parent_work_in_progress,
                child,
                order_sibling: None,
                order_sibling_current: None,
                parent_state_node,
                child_state_node,
                order_sibling_state_node: StateNodeHandle::NONE,
                parent_props,
                child_props,
                order_sibling_props: PropsHandle::NONE,
                deletion_list: Some(deletion_list),
            },
        )
    }

    fn managed_child_placement_sibling_order_complete_fixture()
    -> (FiberArena, ManagedChildCompleteFixture) {
        let mut arena = FiberArena::new();
        let root = FiberRootId::new(3).unwrap();
        let parent_state_node = StateNodeHandle::from_raw(20_401);
        let child_state_node = StateNodeHandle::from_raw(20_402);
        let order_sibling_state_node = StateNodeHandle::from_raw(20_403);
        let parent_props = PropsHandle::from_raw(20_404);
        let child_props = PropsHandle::from_raw(20_405);
        let order_sibling_props = PropsHandle::from_raw(20_406);
        let parent_current =
            arena.create_fiber(FiberTag::HostComponent, None, parent_props, FiberMode::NO);
        {
            let node = arena.get_mut(parent_current).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let order_sibling_current = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            order_sibling_props,
            FiberMode::NO,
        );
        {
            let node = arena.get_mut(order_sibling_current).unwrap();
            node.set_state_node(order_sibling_state_node);
            node.set_memoized_props(order_sibling_props);
        }
        arena
            .set_children(parent_current, &[order_sibling_current])
            .unwrap();

        let parent_work_in_progress = arena
            .create_work_in_progress(parent_current, parent_props)
            .unwrap();
        {
            let node = arena.get_mut(parent_work_in_progress).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let child = arena.create_fiber(FiberTag::HostComponent, None, child_props, FiberMode::NO);
        {
            let node = arena.get_mut(child).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
            node.set_state_node(child_state_node);
            node.set_memoized_props(child_props);
        }
        let order_sibling = arena
            .create_work_in_progress(order_sibling_current, order_sibling_props)
            .unwrap();
        {
            let node = arena.get_mut(order_sibling).unwrap();
            node.set_state_node(order_sibling_state_node);
            node.set_memoized_props(order_sibling_props);
        }
        arena
            .set_children(parent_work_in_progress, &[child, order_sibling])
            .unwrap();

        (
            arena,
            ManagedChildCompleteFixture {
                root,
                parent_current,
                parent_work_in_progress,
                child,
                order_sibling: Some(order_sibling),
                order_sibling_current: Some(order_sibling_current),
                parent_state_node,
                child_state_node,
                order_sibling_state_node,
                parent_props,
                child_props,
                order_sibling_props,
                deletion_list: None,
            },
        )
    }

    fn managed_child_delete_sibling_order_complete_fixture()
    -> (FiberArena, ManagedChildCompleteFixture) {
        let mut arena = FiberArena::new();
        let root = FiberRootId::new(4).unwrap();
        let parent_state_node = StateNodeHandle::from_raw(20_501);
        let child_state_node = StateNodeHandle::from_raw(20_502);
        let order_sibling_state_node = StateNodeHandle::from_raw(20_503);
        let parent_props = PropsHandle::from_raw(20_504);
        let child_props = PropsHandle::from_raw(20_505);
        let order_sibling_props = PropsHandle::from_raw(20_506);
        let parent_current =
            arena.create_fiber(FiberTag::HostComponent, None, parent_props, FiberMode::NO);
        {
            let node = arena.get_mut(parent_current).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let order_sibling_current = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            order_sibling_props,
            FiberMode::NO,
        );
        {
            let node = arena.get_mut(order_sibling_current).unwrap();
            node.set_state_node(order_sibling_state_node);
            node.set_memoized_props(order_sibling_props);
        }
        let child = arena.create_fiber(FiberTag::HostComponent, None, child_props, FiberMode::NO);
        {
            let node = arena.get_mut(child).unwrap();
            node.set_state_node(child_state_node);
            node.set_memoized_props(child_props);
        }
        arena
            .set_children(parent_current, &[order_sibling_current, child])
            .unwrap();

        let parent_work_in_progress = arena
            .create_work_in_progress(parent_current, parent_props)
            .unwrap();
        {
            let node = arena.get_mut(parent_work_in_progress).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let order_sibling = arena
            .create_work_in_progress(order_sibling_current, order_sibling_props)
            .unwrap();
        {
            let node = arena.get_mut(order_sibling).unwrap();
            node.set_state_node(order_sibling_state_node);
            node.set_memoized_props(order_sibling_props);
        }
        arena
            .set_children(parent_work_in_progress, &[order_sibling])
            .unwrap();
        let deletion_list = arena
            .mark_child_for_deletion(parent_work_in_progress, child)
            .unwrap();

        (
            arena,
            ManagedChildCompleteFixture {
                root,
                parent_current,
                parent_work_in_progress,
                child,
                order_sibling: Some(order_sibling),
                order_sibling_current: Some(order_sibling_current),
                parent_state_node,
                child_state_node,
                order_sibling_state_node,
                parent_props,
                child_props,
                order_sibling_props,
                deletion_list: Some(deletion_list),
            },
        )
    }

    fn managed_child_placement_text_complete_fixture() -> (FiberArena, ManagedChildCompleteFixture)
    {
        let mut arena = FiberArena::new();
        let root = FiberRootId::new(5).unwrap();
        let parent_state_node = StateNodeHandle::from_raw(20_701);
        let child_state_node = StateNodeHandle::from_raw(20_702);
        let parent_props = PropsHandle::from_raw(20_703);
        let child_props = PropsHandle::from_raw(20_704);
        let parent_current =
            arena.create_fiber(FiberTag::HostComponent, None, parent_props, FiberMode::NO);
        {
            let node = arena.get_mut(parent_current).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let parent_work_in_progress = arena
            .create_work_in_progress(parent_current, parent_props)
            .unwrap();
        {
            let node = arena.get_mut(parent_work_in_progress).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let child = arena.create_fiber(FiberTag::HostText, None, child_props, FiberMode::NO);
        {
            let node = arena.get_mut(child).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
            node.set_state_node(child_state_node);
            node.set_memoized_props(child_props);
        }
        arena
            .set_children(parent_work_in_progress, &[child])
            .unwrap();

        (
            arena,
            ManagedChildCompleteFixture {
                root,
                parent_current,
                parent_work_in_progress,
                child,
                order_sibling: None,
                order_sibling_current: None,
                parent_state_node,
                child_state_node,
                order_sibling_state_node: StateNodeHandle::NONE,
                parent_props,
                child_props,
                order_sibling_props: PropsHandle::NONE,
                deletion_list: None,
            },
        )
    }

    fn managed_child_delete_text_complete_fixture() -> (FiberArena, ManagedChildCompleteFixture) {
        let mut arena = FiberArena::new();
        let root = FiberRootId::new(6).unwrap();
        let parent_state_node = StateNodeHandle::from_raw(20_801);
        let child_state_node = StateNodeHandle::from_raw(20_802);
        let parent_props = PropsHandle::from_raw(20_803);
        let child_props = PropsHandle::from_raw(20_804);
        let parent_current =
            arena.create_fiber(FiberTag::HostComponent, None, parent_props, FiberMode::NO);
        {
            let node = arena.get_mut(parent_current).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let child = arena.create_fiber(FiberTag::HostText, None, child_props, FiberMode::NO);
        {
            let node = arena.get_mut(child).unwrap();
            node.set_state_node(child_state_node);
            node.set_memoized_props(child_props);
        }
        arena.set_children(parent_current, &[child]).unwrap();

        let parent_work_in_progress = arena
            .create_work_in_progress(parent_current, parent_props)
            .unwrap();
        {
            let node = arena.get_mut(parent_work_in_progress).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let deletion_list = arena
            .mark_child_for_deletion(parent_work_in_progress, child)
            .unwrap();

        (
            arena,
            ManagedChildCompleteFixture {
                root,
                parent_current,
                parent_work_in_progress,
                child,
                order_sibling: None,
                order_sibling_current: None,
                parent_state_node,
                child_state_node,
                order_sibling_state_node: StateNodeHandle::NONE,
                parent_props,
                child_props,
                order_sibling_props: PropsHandle::NONE,
                deletion_list: Some(deletion_list),
            },
        )
    }

    fn managed_child_text_placement_sibling_order_complete_fixture()
    -> (FiberArena, ManagedChildCompleteFixture) {
        let mut arena = FiberArena::new();
        let root = FiberRootId::new(7).unwrap();
        let parent_state_node = StateNodeHandle::from_raw(20_901);
        let child_state_node = StateNodeHandle::from_raw(20_902);
        let order_sibling_state_node = StateNodeHandle::from_raw(20_903);
        let parent_props = PropsHandle::from_raw(20_904);
        let child_props = PropsHandle::from_raw(20_905);
        let order_sibling_props = PropsHandle::from_raw(20_906);
        let parent_current =
            arena.create_fiber(FiberTag::HostComponent, None, parent_props, FiberMode::NO);
        {
            let node = arena.get_mut(parent_current).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let order_sibling_current =
            arena.create_fiber(FiberTag::HostText, None, order_sibling_props, FiberMode::NO);
        {
            let node = arena.get_mut(order_sibling_current).unwrap();
            node.set_state_node(order_sibling_state_node);
            node.set_memoized_props(order_sibling_props);
        }
        arena
            .set_children(parent_current, &[order_sibling_current])
            .unwrap();

        let parent_work_in_progress = arena
            .create_work_in_progress(parent_current, parent_props)
            .unwrap();
        {
            let node = arena.get_mut(parent_work_in_progress).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
        }
        let child = arena.create_fiber(FiberTag::HostText, None, child_props, FiberMode::NO);
        {
            let node = arena.get_mut(child).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
            node.set_state_node(child_state_node);
            node.set_memoized_props(child_props);
        }
        let order_sibling = arena
            .create_work_in_progress(order_sibling_current, order_sibling_props)
            .unwrap();
        {
            let node = arena.get_mut(order_sibling).unwrap();
            node.set_state_node(order_sibling_state_node);
            node.set_memoized_props(order_sibling_props);
        }
        arena
            .set_children(parent_work_in_progress, &[child, order_sibling])
            .unwrap();

        (
            arena,
            ManagedChildCompleteFixture {
                root,
                parent_current,
                parent_work_in_progress,
                child,
                order_sibling: Some(order_sibling),
                order_sibling_current: Some(order_sibling_current),
                parent_state_node,
                child_state_node,
                order_sibling_state_node,
                parent_props,
                child_props,
                order_sibling_props,
                deletion_list: None,
            },
        )
    }

    #[derive(Debug, Clone, Copy)]
    struct TerminalHostDescendantFixture {
        parent: FiberId,
        function: FiberId,
        first_terminal: FiberId,
        fragment: FiberId,
        second_terminal: FiberId,
        nested_host_text: FiberId,
        parent_state_node: StateNodeHandle,
        first_terminal_state_node: StateNodeHandle,
        second_terminal_state_node: StateNodeHandle,
        nested_host_text_state_node: StateNodeHandle,
    }

    impl TerminalHostDescendantFixture {
        fn expected_rows(self) -> [TerminalHostDescendantExpectedRowForCanary; 2] {
            [
                TerminalHostDescendantExpectedRowForCanary::new(
                    self.parent,
                    0,
                    self.first_terminal,
                    FiberTag::HostComponent,
                    self.first_terminal_state_node,
                ),
                TerminalHostDescendantExpectedRowForCanary::new(
                    self.parent,
                    1,
                    self.second_terminal,
                    FiberTag::HostText,
                    self.second_terminal_state_node,
                ),
            ]
        }
    }

    fn terminal_host_descendant_fixture() -> (FiberArena, TerminalHostDescendantFixture) {
        let mut arena = FiberArena::new();
        let parent_state_node = StateNodeHandle::from_raw(30_001);
        let first_terminal_state_node = StateNodeHandle::from_raw(30_002);
        let second_terminal_state_node = StateNodeHandle::from_raw(30_003);
        let nested_host_text_state_node = StateNodeHandle::from_raw(30_004);

        let parent = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(30_101),
            FiberMode::NO,
        );
        arena
            .get_mut(parent)
            .unwrap()
            .set_state_node(parent_state_node);
        let function = arena.create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(30_102),
            FiberMode::NO,
        );
        let first_terminal = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(30_103),
            FiberMode::NO,
        );
        arena
            .get_mut(first_terminal)
            .unwrap()
            .set_state_node(first_terminal_state_node);
        let fragment = arena.create_fiber(
            FiberTag::Fragment,
            None,
            PropsHandle::from_raw(30_104),
            FiberMode::NO,
        );
        let second_terminal = arena.create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(30_105),
            FiberMode::NO,
        );
        arena
            .get_mut(second_terminal)
            .unwrap()
            .set_state_node(second_terminal_state_node);
        let nested_host_text = arena.create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(30_106),
            FiberMode::NO,
        );
        arena
            .get_mut(nested_host_text)
            .unwrap()
            .set_state_node(nested_host_text_state_node);

        arena
            .set_children(first_terminal, &[nested_host_text])
            .unwrap();
        arena.set_children(fragment, &[second_terminal]).unwrap();
        arena
            .set_children(function, &[first_terminal, fragment])
            .unwrap();
        arena.set_children(parent, &[function]).unwrap();

        (
            arena,
            TerminalHostDescendantFixture {
                parent,
                function,
                first_terminal,
                fragment,
                second_terminal,
                nested_host_text,
                parent_state_node,
                first_terminal_state_node,
                second_terminal_state_node,
                nested_host_text_state_node,
            },
        )
    }

    fn terminal_host_descendant_boundary_fixture(
        boundary_tag: FiberTag,
    ) -> (FiberArena, FiberId, FiberId, FiberId) {
        let mut arena = FiberArena::new();
        let parent = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(30_201),
            FiberMode::NO,
        );
        arena
            .get_mut(parent)
            .unwrap()
            .set_state_node(StateNodeHandle::from_raw(30_202));
        let boundary = arena.create_fiber(
            boundary_tag,
            None,
            PropsHandle::from_raw(30_203),
            FiberMode::NO,
        );
        let terminal = arena.create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(30_204),
            FiberMode::NO,
        );
        arena
            .get_mut(terminal)
            .unwrap()
            .set_state_node(StateNodeHandle::from_raw(30_205));
        arena.set_children(boundary, &[terminal]).unwrap();
        arena.set_children(parent, &[boundary]).unwrap();

        (arena, parent, boundary, terminal)
    }

    #[derive(Debug, Clone, Copy)]
    struct HostRootContainerDescendantFixture {
        root: FiberRootId,
        current: FiberId,
        work_in_progress: FiberId,
        function: FiberId,
        first_terminal: FiberId,
        fragment: FiberId,
        second_terminal: FiberId,
        nested_host_text: FiberId,
        root_state_node: StateNodeHandle,
        first_terminal_state_node: StateNodeHandle,
        second_terminal_state_node: StateNodeHandle,
        nested_host_text_state_node: StateNodeHandle,
    }

    impl HostRootContainerDescendantFixture {
        fn source_rows(self) -> [HostRootContainerDescendantSourceRowForCanary; 2] {
            [
                HostRootContainerDescendantSourceRowForCanary::new(
                    self.root,
                    self.current,
                    self.work_in_progress,
                    0,
                    self.first_terminal,
                    FiberTag::HostComponent,
                    self.first_terminal_state_node,
                ),
                HostRootContainerDescendantSourceRowForCanary::new(
                    self.root,
                    self.current,
                    self.work_in_progress,
                    1,
                    self.second_terminal,
                    FiberTag::HostText,
                    self.second_terminal_state_node,
                ),
            ]
        }
    }

    fn host_root_container_pair(
        arena: &mut FiberArena,
        root_raw: u64,
    ) -> (FiberRootId, FiberId, FiberId) {
        let root = FiberRootId::new(root_raw).unwrap();
        let current = arena.create_fiber(
            FiberTag::HostRoot,
            None,
            PropsHandle::NONE,
            FiberMode::CONCURRENT,
        );
        arena
            .get_mut(current)
            .unwrap()
            .set_state_node(root.state_node_handle());
        let work_in_progress = arena
            .create_work_in_progress(current, PropsHandle::NONE)
            .unwrap();
        (root, current, work_in_progress)
    }

    fn host_root_container_descendant_fixture() -> (FiberArena, HostRootContainerDescendantFixture)
    {
        let mut arena = FiberArena::new();
        let (root, current, work_in_progress) = host_root_container_pair(&mut arena, 92_800_001);
        let root_state_node = root.state_node_handle();
        let first_terminal_state_node = StateNodeHandle::from_raw(92_801_001);
        let second_terminal_state_node = StateNodeHandle::from_raw(92_801_002);
        let nested_host_text_state_node = StateNodeHandle::from_raw(92_801_003);

        let function = arena.create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(92_802_001),
            FiberMode::NO,
        );
        let first_terminal = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(92_802_002),
            FiberMode::NO,
        );
        arena
            .get_mut(first_terminal)
            .unwrap()
            .set_state_node(first_terminal_state_node);
        let fragment = arena.create_fiber(
            FiberTag::Fragment,
            None,
            PropsHandle::from_raw(92_802_003),
            FiberMode::NO,
        );
        let second_terminal = arena.create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(92_802_004),
            FiberMode::NO,
        );
        arena
            .get_mut(second_terminal)
            .unwrap()
            .set_state_node(second_terminal_state_node);
        let nested_host_text = arena.create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(92_802_005),
            FiberMode::NO,
        );
        arena
            .get_mut(nested_host_text)
            .unwrap()
            .set_state_node(nested_host_text_state_node);

        arena
            .set_children(first_terminal, &[nested_host_text])
            .unwrap();
        arena.set_children(fragment, &[second_terminal]).unwrap();
        arena
            .set_children(function, &[first_terminal, fragment])
            .unwrap();
        arena.set_children(work_in_progress, &[function]).unwrap();

        (
            arena,
            HostRootContainerDescendantFixture {
                root,
                current,
                work_in_progress,
                function,
                first_terminal,
                fragment,
                second_terminal,
                nested_host_text,
                root_state_node,
                first_terminal_state_node,
                second_terminal_state_node,
                nested_host_text_state_node,
            },
        )
    }

    fn host_root_container_boundary_fixture(
        boundary_tag: FiberTag,
    ) -> (FiberArena, FiberRootId, FiberId, FiberId, FiberId, FiberId) {
        let mut arena = FiberArena::new();
        let (root, current, work_in_progress) =
            host_root_container_pair(&mut arena, 92_810_001 + u64::from(boundary_tag.react_tag()));
        let boundary = arena.create_fiber(
            boundary_tag,
            None,
            PropsHandle::from_raw(92_811_001),
            FiberMode::NO,
        );
        let terminal = arena.create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(92_811_002),
            FiberMode::NO,
        );
        arena
            .get_mut(terminal)
            .unwrap()
            .set_state_node(StateNodeHandle::from_raw(92_811_003));
        arena.set_children(boundary, &[terminal]).unwrap();
        arena.set_children(work_in_progress, &[boundary]).unwrap();

        (arena, root, current, work_in_progress, boundary, terminal)
    }

    #[test]
    fn append_all_children_terminal_host_canary_collects_ordered_descendants_without_mutation() {
        let (arena, fixture) = terminal_host_descendant_fixture();
        let expected = fixture.expected_rows();
        let parent_children_before = arena.child_ids(fixture.parent).unwrap();
        let function_children_before = arena.child_ids(fixture.function).unwrap();
        let fragment_children_before = arena.child_ids(fixture.fragment).unwrap();

        let record = terminal_host_descendant_collection_complete_work_record_for_canary(
            &arena,
            fixture.parent,
            &expected,
        )
        .unwrap();

        assert_eq!(record.parent(), fixture.parent);
        assert_eq!(record.parent_state_node(), fixture.parent_state_node);
        let source = record.source_evidence();
        assert_eq!(source.react_version(), "19.2.6");
        assert_eq!(
            source.react_commit(),
            "eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401"
        );
        assert_eq!(
            source.source_path(),
            "packages/react-reconciler/src/ReactFiberCompleteWork.js"
        );
        assert_eq!(source.append_all_children_start_line(), 240);
        assert_eq!(source.append_all_children_end_line(), 342);
        assert_eq!(source.terminal_host_condition_line(), 251);
        assert_eq!(source.append_initial_child_line(), 252);
        assert_eq!(source.portal_skip_line(), 254);
        assert_eq!(source.descend_to_child_line(), 261);
        assert_eq!(source.sibling_return_repair_line(), 278);
        assert_eq!(source.host_component_mount_call_line(), 1399);

        assert_eq!(record.terminal_descendant_count(), 2);
        assert_eq!(
            record.terminal_descendants()[0],
            TerminalHostDescendantRowForCanary {
                parent: fixture.parent,
                ordinal: 0,
                terminal: fixture.first_terminal,
                terminal_tag: FiberTag::HostComponent,
                terminal_state_node: fixture.first_terminal_state_node,
                direct_parent: fixture.function,
            }
        );
        assert_eq!(
            record.terminal_descendants()[1],
            TerminalHostDescendantRowForCanary {
                parent: fixture.parent,
                ordinal: 1,
                terminal: fixture.second_terminal,
                terminal_tag: FiberTag::HostText,
                terminal_state_node: fixture.second_terminal_state_node,
                direct_parent: fixture.fragment,
            }
        );
        assert!(
            !record
                .terminal_descendants()
                .iter()
                .any(|row| row.terminal() == fixture.nested_host_text)
        );
        assert_eq!(
            arena.get(fixture.nested_host_text).unwrap().state_node(),
            fixture.nested_host_text_state_node
        );

        assert_eq!(record.skipped_wrapper_count(), 2);
        assert_eq!(
            record.skipped_wrappers()[0],
            TerminalHostDescendantSkippedWrapperForCanary {
                parent: fixture.parent,
                wrapper: fixture.function,
                wrapper_tag: FiberTag::FunctionComponent,
                direct_parent: fixture.parent,
                child_count: 2,
            }
        );
        assert_eq!(
            record.skipped_wrappers()[1],
            TerminalHostDescendantSkippedWrapperForCanary {
                parent: fixture.parent,
                wrapper: fixture.fragment,
                wrapper_tag: FiberTag::Fragment,
                direct_parent: fixture.function,
                child_count: 1,
            }
        );
        assert_eq!(
            record.host_mutation_blocker(),
            TerminalHostDescendantHostMutationBlockerForCanary::CollectionOnlyDoesNotCallAppendInitialChild
        );
        assert_eq!(
            record.host_mutation_blocker().as_str(),
            "collection-only-does-not-call-append-initial-child"
        );
        assert!(!record.append_initial_child_called());
        assert!(!record.host_mutation_performed());
        assert!(record.private_reconciler_handoff_only());
        assert!(!record.public_dom_compatibility_claimed());
        assert!(!record.test_renderer_compatibility_claimed());
        validate_terminal_host_descendant_private_scope_for_canary(&record).unwrap();

        assert_eq!(
            arena.child_ids(fixture.parent).unwrap(),
            parent_children_before
        );
        assert_eq!(
            arena.child_ids(fixture.function).unwrap(),
            function_children_before
        );
        assert_eq!(
            arena.child_ids(fixture.fragment).unwrap(),
            fragment_children_before
        );
        assert_eq!(
            arena.get(fixture.first_terminal).unwrap().state_node(),
            fixture.first_terminal_state_node
        );
        assert_eq!(
            arena.get(fixture.second_terminal).unwrap().state_node(),
            fixture.second_terminal_state_node
        );
    }

    #[test]
    fn append_all_children_terminal_host_canary_rejects_portal_child() {
        let (arena, parent, portal, _terminal) =
            terminal_host_descendant_boundary_fixture(FiberTag::Portal);

        assert_eq!(
            terminal_host_descendant_collection_complete_work_record_for_canary(
                &arena,
                parent,
                &[],
            ),
            Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::PortalTraversalBlocked {
                    parent,
                    portal,
                },
            )
        );
    }

    #[test]
    fn append_all_children_terminal_host_canary_blocks_suspense_and_offscreen_visibility_claims() {
        let (arena, parent, suspense, _terminal) =
            terminal_host_descendant_boundary_fixture(FiberTag::Suspense);
        assert_eq!(
            terminal_host_descendant_collection_complete_work_record_for_canary(
                &arena,
                parent,
                &[],
            ),
            Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::VisibilityBoundaryTraversalBlocked {
                    parent,
                    boundary: suspense,
                    tag: FiberTag::Suspense,
                },
            )
        );

        let (arena, parent, offscreen, _terminal) =
            terminal_host_descendant_boundary_fixture(FiberTag::Offscreen);
        assert_eq!(
            terminal_host_descendant_collection_complete_work_record_for_canary(
                &arena,
                parent,
                &[],
            ),
            Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::VisibilityBoundaryTraversalBlocked {
                    parent,
                    boundary: offscreen,
                    tag: FiberTag::Offscreen,
                },
            )
        );
    }

    #[test]
    fn append_all_children_terminal_host_canary_rejects_missing_state_node() {
        let (mut arena, fixture) = terminal_host_descendant_fixture();
        let expected = fixture.expected_rows();
        arena
            .get_mut(fixture.second_terminal)
            .unwrap()
            .set_state_node(StateNodeHandle::NONE);

        assert_eq!(
            terminal_host_descendant_collection_complete_work_record_for_canary(
                &arena,
                fixture.parent,
                &expected,
            ),
            Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::MissingTerminalStateNode {
                    parent: fixture.parent,
                    terminal: fixture.second_terminal,
                    tag: FiberTag::HostText,
                },
            )
        );
    }

    #[test]
    fn append_all_children_terminal_host_canary_rejects_order_drift_and_duplicate_rows() {
        let (mut arena, fixture) = terminal_host_descendant_fixture();
        let expected = fixture.expected_rows();
        arena
            .set_children(
                fixture.function,
                &[fixture.fragment, fixture.first_terminal],
            )
            .unwrap();

        assert_eq!(
            terminal_host_descendant_collection_complete_work_record_for_canary(
                &arena,
                fixture.parent,
                &expected,
            ),
            Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::TerminalChildOrderMismatch {
                    parent: fixture.parent,
                    expected: expected.to_vec(),
                    actual: vec![
                        TerminalHostDescendantRowForCanary {
                            parent: fixture.parent,
                            ordinal: 0,
                            terminal: fixture.second_terminal,
                            terminal_tag: FiberTag::HostText,
                            terminal_state_node: fixture.second_terminal_state_node,
                            direct_parent: fixture.fragment,
                        },
                        TerminalHostDescendantRowForCanary {
                            parent: fixture.parent,
                            ordinal: 1,
                            terminal: fixture.first_terminal,
                            terminal_tag: FiberTag::HostComponent,
                            terminal_state_node: fixture.first_terminal_state_node,
                            direct_parent: fixture.function,
                        },
                    ],
                },
            )
        );

        let (arena, fixture) = terminal_host_descendant_fixture();
        let duplicate_rows = [fixture.expected_rows()[0], fixture.expected_rows()[0]];
        assert_eq!(
            terminal_host_descendant_collection_complete_work_record_for_canary(
                &arena,
                fixture.parent,
                &duplicate_rows,
            ),
            Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::DuplicateTerminalChild {
                    parent: fixture.parent,
                    terminal: fixture.first_terminal,
                },
            )
        );
    }

    #[test]
    fn append_all_children_terminal_host_canary_rejects_stale_or_cloned_rows() {
        let (mut arena, fixture) = terminal_host_descendant_fixture();
        let cloned_terminal = arena
            .create_work_in_progress(fixture.first_terminal, PropsHandle::from_raw(30_301))
            .unwrap();
        let stale_row = TerminalHostDescendantExpectedRowForCanary::new(
            fixture.parent,
            0,
            cloned_terminal,
            FiberTag::HostComponent,
            fixture.first_terminal_state_node,
        );
        let expected = [
            stale_row,
            TerminalHostDescendantExpectedRowForCanary::new(
                fixture.parent,
                1,
                fixture.second_terminal,
                FiberTag::HostText,
                fixture.second_terminal_state_node,
            ),
        ];

        assert_eq!(
            terminal_host_descendant_collection_complete_work_record_for_canary(
                &arena,
                fixture.parent,
                &expected,
            ),
            Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::StaleOrClonedTerminalRow {
                    parent: fixture.parent,
                    row: stale_row,
                    reason: "expected terminal row is not inside parent subtree",
                },
            )
        );
    }

    #[test]
    fn append_all_children_terminal_host_canary_rejects_public_compatibility_claims() {
        let (arena, fixture) = terminal_host_descendant_fixture();
        let expected = fixture.expected_rows();
        let record = terminal_host_descendant_collection_complete_work_record_for_canary(
            &arena,
            fixture.parent,
            &expected,
        )
        .unwrap();

        assert_eq!(
            validate_terminal_host_descendant_private_scope_for_canary(
                &record
                    .clone()
                    .with_public_dom_compatibility_claimed_for_canary(),
            ),
            Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::PublicCompatibilityClaimed {
                    parent: fixture.parent,
                    compatibility: TerminalHostDescendantCompatibilityClaimForCanary::PublicDom,
                },
            )
        );
        assert_eq!(
            TerminalHostDescendantCompatibilityClaimForCanary::PublicDom.as_str(),
            "public-dom"
        );

        assert_eq!(
            validate_terminal_host_descendant_private_scope_for_canary(
                &record.with_test_renderer_compatibility_claimed_for_canary(),
            ),
            Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::PublicCompatibilityClaimed {
                    parent: fixture.parent,
                    compatibility: TerminalHostDescendantCompatibilityClaimForCanary::TestRenderer,
                },
            )
        );
        assert_eq!(
            TerminalHostDescendantCompatibilityClaimForCanary::TestRenderer.as_str(),
            "test-renderer"
        );
    }

    #[test]
    fn append_all_children_to_container_canary_collects_host_root_descendants_without_mutation() {
        let (arena, fixture) = host_root_container_descendant_fixture();
        let expected = fixture.source_rows();
        let root_children_before = arena.child_ids(fixture.work_in_progress).unwrap();
        let function_children_before = arena.child_ids(fixture.function).unwrap();
        let fragment_children_before = arena.child_ids(fixture.fragment).unwrap();
        let first_terminal_children_before = arena.child_ids(fixture.first_terminal).unwrap();

        let record = host_root_container_descendant_collection_complete_work_record_for_canary(
            &arena,
            fixture.root,
            fixture.current,
            fixture.work_in_progress,
            &expected,
        )
        .unwrap();

        assert_eq!(record.root(), fixture.root);
        assert_eq!(record.current(), fixture.current);
        assert_eq!(record.work_in_progress(), fixture.work_in_progress);
        assert_eq!(record.container_state_node(), fixture.root_state_node);
        let currentness = record.currentness();
        assert!(currentness.is_current_work_in_progress_pair());
        assert_eq!(currentness.root(), fixture.root);
        assert_eq!(currentness.current(), fixture.current);
        assert_eq!(currentness.work_in_progress(), fixture.work_in_progress);
        assert_eq!(currentness.container_state_node(), fixture.root_state_node);
        assert_eq!(currentness.current_state_node(), fixture.root_state_node);
        assert_eq!(
            currentness.work_in_progress_state_node(),
            fixture.root_state_node
        );
        assert_eq!(
            currentness.current_alternate(),
            Some(fixture.work_in_progress)
        );
        assert_eq!(
            currentness.work_in_progress_alternate(),
            Some(fixture.current)
        );

        let source = record.source_evidence();
        assert_eq!(source.react_version(), "19.2.6");
        assert_eq!(
            source.react_commit(),
            "eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401"
        );
        assert_eq!(
            source.source_path(),
            "packages/react-reconciler/src/ReactFiberCompleteWork.js"
        );
        assert_eq!(source.append_all_children_to_container_start_line(), 347);
        assert_eq!(source.append_all_children_to_container_end_line(), 426);
        assert_eq!(source.host_component_condition_line(), 363);
        assert_eq!(source.host_component_append_child_set_line(), 371);
        assert_eq!(source.host_text_condition_line(), 372);
        assert_eq!(source.host_text_append_child_set_line(), 379);
        assert_eq!(source.portal_skip_line(), 380);
        assert_eq!(source.offscreen_visibility_line(), 384);
        assert_eq!(source.offscreen_recursive_call_line(), 394);
        assert_eq!(source.descend_to_child_line(), 402);
        assert_eq!(source.sibling_return_repair_line(), 420);
        assert_eq!(source.update_host_container_call_line(), 439);
        assert_eq!(source.finalize_container_children_line(), 448);

        assert_eq!(record.terminal_descendant_count(), 2);
        assert_eq!(
            record.terminal_descendants()[0],
            HostRootContainerDescendantRowForCanary {
                root: fixture.root,
                current: fixture.current,
                work_in_progress: fixture.work_in_progress,
                ordinal: 0,
                terminal: fixture.first_terminal,
                terminal_tag: FiberTag::HostComponent,
                terminal_state_node: fixture.first_terminal_state_node,
                direct_parent: fixture.function,
            }
        );
        assert_eq!(record.terminal_descendants()[0].source_row(), expected[0]);
        assert_eq!(record.terminal_descendants()[0].root(), fixture.root);
        assert_eq!(record.terminal_descendants()[0].current(), fixture.current);
        assert_eq!(
            record.terminal_descendants()[0].work_in_progress(),
            fixture.work_in_progress
        );
        assert_eq!(record.terminal_descendants()[0].ordinal(), 0);
        assert_eq!(
            record.terminal_descendants()[0].terminal(),
            fixture.first_terminal
        );
        assert_eq!(
            record.terminal_descendants()[0].terminal_tag(),
            FiberTag::HostComponent
        );
        assert_eq!(
            record.terminal_descendants()[0].terminal_state_node(),
            fixture.first_terminal_state_node
        );
        assert_eq!(
            record.terminal_descendants()[0].direct_parent(),
            fixture.function
        );
        assert_eq!(
            record.terminal_descendants()[1],
            HostRootContainerDescendantRowForCanary {
                root: fixture.root,
                current: fixture.current,
                work_in_progress: fixture.work_in_progress,
                ordinal: 1,
                terminal: fixture.second_terminal,
                terminal_tag: FiberTag::HostText,
                terminal_state_node: fixture.second_terminal_state_node,
                direct_parent: fixture.fragment,
            }
        );
        assert!(
            !record
                .terminal_descendants()
                .iter()
                .any(|row| row.terminal() == fixture.nested_host_text)
        );

        assert_eq!(record.skipped_wrapper_count(), 2);
        assert_eq!(
            record.skipped_wrappers()[0],
            HostRootContainerDescendantSkippedWrapperForCanary {
                root: fixture.root,
                current: fixture.current,
                work_in_progress: fixture.work_in_progress,
                wrapper: fixture.function,
                wrapper_tag: FiberTag::FunctionComponent,
                direct_parent: fixture.work_in_progress,
                child_count: 2,
            }
        );
        assert_eq!(record.skipped_wrappers()[0].root(), fixture.root);
        assert_eq!(record.skipped_wrappers()[0].current(), fixture.current);
        assert_eq!(
            record.skipped_wrappers()[0].work_in_progress(),
            fixture.work_in_progress
        );
        assert_eq!(record.skipped_wrappers()[0].wrapper(), fixture.function);
        assert_eq!(
            record.skipped_wrappers()[0].wrapper_tag(),
            FiberTag::FunctionComponent
        );
        assert_eq!(
            record.skipped_wrappers()[0].direct_parent(),
            fixture.work_in_progress
        );
        assert_eq!(record.skipped_wrappers()[0].child_count(), 2);
        assert_eq!(
            record.skipped_wrappers()[1],
            HostRootContainerDescendantSkippedWrapperForCanary {
                root: fixture.root,
                current: fixture.current,
                work_in_progress: fixture.work_in_progress,
                wrapper: fixture.fragment,
                wrapper_tag: FiberTag::Fragment,
                direct_parent: fixture.function,
                child_count: 1,
            }
        );

        assert_eq!(
            record.mutation_blocker(),
            HostRootContainerDescendantMutationBlockerForCanary::CollectionOnlyDoesNotCreateOrAppendContainerChildSet
        );
        assert_eq!(
            record.mutation_blocker().as_str(),
            "collection-only-does-not-create-or-append-container-child-set"
        );
        assert!(!record.append_child_to_container_child_set_called());
        assert!(!record.container_child_set_mutation_performed());
        assert!(!record.host_child_mutation_performed());
        assert!(record.private_reconciler_handoff_only());
        assert!(!record.public_dom_compatibility_claimed());
        assert!(!record.test_renderer_compatibility_claimed());
        assert!(!record.persistence_container_child_set_compatibility_claimed());
        assert!(!record.public_root_behavior_claimed());
        assert!(!record.renderer_compatibility_claimed());
        assert!(!record.package_compatibility_claimed());
        validate_host_root_container_descendant_private_scope_for_canary(&record).unwrap();

        assert_eq!(
            arena.child_ids(fixture.work_in_progress).unwrap(),
            root_children_before
        );
        assert_eq!(
            arena.child_ids(fixture.function).unwrap(),
            function_children_before
        );
        assert_eq!(
            arena.child_ids(fixture.fragment).unwrap(),
            fragment_children_before
        );
        assert_eq!(
            arena.child_ids(fixture.first_terminal).unwrap(),
            first_terminal_children_before
        );
        assert_eq!(
            arena.get(fixture.first_terminal).unwrap().state_node(),
            fixture.first_terminal_state_node
        );
        assert_eq!(
            arena.get(fixture.second_terminal).unwrap().state_node(),
            fixture.second_terminal_state_node
        );
        assert_eq!(
            arena.get(fixture.nested_host_text).unwrap().state_node(),
            fixture.nested_host_text_state_node
        );
    }

    #[test]
    fn append_all_children_to_container_canary_rejects_portal_visibility_and_unsupported_wrappers()
    {
        let (arena, root, current, work_in_progress, portal, _terminal) =
            host_root_container_boundary_fixture(FiberTag::Portal);
        assert_eq!(
            host_root_container_descendant_collection_complete_work_record_for_canary(
                &arena,
                root,
                current,
                work_in_progress,
                &[],
            ),
            Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::PortalTraversalBlocked {
                    root,
                    work_in_progress,
                    portal,
                },
            )
        );

        let (arena, root, current, work_in_progress, suspense, _terminal) =
            host_root_container_boundary_fixture(FiberTag::Suspense);
        assert_eq!(
            host_root_container_descendant_collection_complete_work_record_for_canary(
                &arena,
                root,
                current,
                work_in_progress,
                &[],
            ),
            Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::VisibilityBoundaryTraversalBlocked {
                    root,
                    work_in_progress,
                    boundary: suspense,
                    tag: FiberTag::Suspense,
                },
            )
        );

        let (arena, root, current, work_in_progress, offscreen, _terminal) =
            host_root_container_boundary_fixture(FiberTag::Offscreen);
        assert_eq!(
            host_root_container_descendant_collection_complete_work_record_for_canary(
                &arena,
                root,
                current,
                work_in_progress,
                &[],
            ),
            Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::VisibilityBoundaryTraversalBlocked {
                    root,
                    work_in_progress,
                    boundary: offscreen,
                    tag: FiberTag::Offscreen,
                },
            )
        );

        let (arena, root, current, work_in_progress, class_component, _terminal) =
            host_root_container_boundary_fixture(FiberTag::ClassComponent);
        assert_eq!(
            host_root_container_descendant_collection_complete_work_record_for_canary(
                &arena,
                root,
                current,
                work_in_progress,
                &[],
            ),
            Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::UnsupportedNonTerminalTraversal {
                    root,
                    work_in_progress,
                    child: class_component,
                    tag: FiberTag::ClassComponent,
                },
            )
        );
    }

    #[test]
    fn append_all_children_to_container_canary_rejects_missing_state_order_and_duplicate_rows() {
        let (mut arena, fixture) = host_root_container_descendant_fixture();
        let expected = fixture.source_rows();
        arena
            .get_mut(fixture.second_terminal)
            .unwrap()
            .set_state_node(StateNodeHandle::NONE);

        assert_eq!(
            host_root_container_descendant_collection_complete_work_record_for_canary(
                &arena,
                fixture.root,
                fixture.current,
                fixture.work_in_progress,
                &expected,
            ),
            Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::MissingTerminalStateNode {
                    root: fixture.root,
                    work_in_progress: fixture.work_in_progress,
                    terminal: fixture.second_terminal,
                    tag: FiberTag::HostText,
                },
            )
        );

        let (mut arena, fixture) = host_root_container_descendant_fixture();
        let expected = fixture.source_rows();
        arena
            .set_children(
                fixture.function,
                &[fixture.fragment, fixture.first_terminal],
            )
            .unwrap();
        assert_eq!(
            host_root_container_descendant_collection_complete_work_record_for_canary(
                &arena,
                fixture.root,
                fixture.current,
                fixture.work_in_progress,
                &expected,
            ),
            Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::TerminalChildOrderMismatch {
                    root: fixture.root,
                    work_in_progress: fixture.work_in_progress,
                    expected: expected.to_vec(),
                    actual: vec![
                        HostRootContainerDescendantRowForCanary {
                            root: fixture.root,
                            current: fixture.current,
                            work_in_progress: fixture.work_in_progress,
                            ordinal: 0,
                            terminal: fixture.second_terminal,
                            terminal_tag: FiberTag::HostText,
                            terminal_state_node: fixture.second_terminal_state_node,
                            direct_parent: fixture.fragment,
                        },
                        HostRootContainerDescendantRowForCanary {
                            root: fixture.root,
                            current: fixture.current,
                            work_in_progress: fixture.work_in_progress,
                            ordinal: 1,
                            terminal: fixture.first_terminal,
                            terminal_tag: FiberTag::HostComponent,
                            terminal_state_node: fixture.first_terminal_state_node,
                            direct_parent: fixture.function,
                        },
                    ],
                },
            )
        );

        let (arena, fixture) = host_root_container_descendant_fixture();
        let duplicate_rows = [fixture.source_rows()[0], fixture.source_rows()[0]];
        assert_eq!(
            host_root_container_descendant_collection_complete_work_record_for_canary(
                &arena,
                fixture.root,
                fixture.current,
                fixture.work_in_progress,
                &duplicate_rows,
            ),
            Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::DuplicateTerminalChild {
                    root: fixture.root,
                    work_in_progress: fixture.work_in_progress,
                    terminal: fixture.first_terminal,
                },
            )
        );
    }

    #[test]
    fn append_all_children_to_container_canary_rejects_stale_or_cloned_source_rows() {
        let (arena, fixture) = host_root_container_descendant_fixture();
        let wrong_root = FiberRootId::new(92_800_002).unwrap();
        let wrong_root_row = HostRootContainerDescendantSourceRowForCanary::new(
            wrong_root,
            fixture.current,
            fixture.work_in_progress,
            0,
            fixture.first_terminal,
            FiberTag::HostComponent,
            fixture.first_terminal_state_node,
        );
        assert_eq!(
            host_root_container_descendant_collection_complete_work_record_for_canary(
                &arena,
                fixture.root,
                fixture.current,
                fixture.work_in_progress,
                &[wrong_root_row],
            ),
            Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::StaleOrClonedContainerSourceRow {
                    root: fixture.root,
                    current: fixture.current,
                    work_in_progress: fixture.work_in_progress,
                    row: wrong_root_row,
                    reason: "expected source row belongs to a different root",
                },
            )
        );

        let (mut arena, fixture) = host_root_container_descendant_fixture();
        let cloned_terminal = arena
            .create_work_in_progress(fixture.first_terminal, PropsHandle::from_raw(92_812_001))
            .unwrap();
        let cloned_row = HostRootContainerDescendantSourceRowForCanary::new(
            fixture.root,
            fixture.current,
            fixture.work_in_progress,
            0,
            cloned_terminal,
            FiberTag::HostComponent,
            fixture.first_terminal_state_node,
        );
        assert_eq!(
            host_root_container_descendant_collection_complete_work_record_for_canary(
                &arena,
                fixture.root,
                fixture.current,
                fixture.work_in_progress,
                &[cloned_row],
            ),
            Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::StaleOrClonedContainerSourceRow {
                    root: fixture.root,
                    current: fixture.current,
                    work_in_progress: fixture.work_in_progress,
                    row: cloned_row,
                    reason: "expected source row is not inside HostRoot work-in-progress subtree",
                },
            )
        );
    }

    #[test]
    fn append_all_children_to_container_canary_rejects_wrong_container_root_currentness() {
        let (arena, fixture) = host_root_container_descendant_fixture();
        let wrong_root = FiberRootId::new(92_800_002).unwrap();
        assert_eq!(
            host_root_container_descendant_collection_complete_work_record_for_canary(
                &arena,
                wrong_root,
                fixture.current,
                fixture.work_in_progress,
                &[],
            ),
            Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::RootContainerStateNodeMismatch {
                    root: wrong_root,
                    fiber: fixture.current,
                    expected_state_node: wrong_root.state_node_handle(),
                    actual_state_node: fixture.root_state_node,
                },
            )
        );

        let (mut arena, fixture) = host_root_container_descendant_fixture();
        let other_current = arena.create_fiber(
            FiberTag::HostRoot,
            None,
            PropsHandle::NONE,
            FiberMode::CONCURRENT,
        );
        arena
            .get_mut(other_current)
            .unwrap()
            .set_state_node(fixture.root_state_node);
        assert_eq!(
            host_root_container_descendant_collection_complete_work_record_for_canary(
                &arena,
                fixture.root,
                other_current,
                fixture.work_in_progress,
                &[],
            ),
            Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::CurrentnessMismatch {
                    current: other_current,
                    current_alternate: None,
                    work_in_progress: fixture.work_in_progress,
                    work_in_progress_alternate: Some(fixture.current),
                },
            )
        );
    }

    #[test]
    fn append_all_children_to_container_canary_rejects_scope_and_mutation_claims() {
        let (arena, fixture) = host_root_container_descendant_fixture();
        let expected = fixture.source_rows();
        let record = host_root_container_descendant_collection_complete_work_record_for_canary(
            &arena,
            fixture.root,
            fixture.current,
            fixture.work_in_progress,
            &expected,
        )
        .unwrap();

        assert_eq!(
            validate_host_root_container_descendant_private_scope_for_canary(
                &record
                    .clone()
                    .with_append_child_to_container_child_set_called_for_canary(),
            ),
            Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::MutationClaimed {
                    root: fixture.root,
                    claim: HostRootContainerDescendantMutationClaimForCanary::AppendChildToContainerChildSet,
                },
            )
        );
        assert_eq!(
            validate_host_root_container_descendant_private_scope_for_canary(
                &record
                    .clone()
                    .with_container_child_set_mutation_performed_for_canary(),
            ),
            Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::MutationClaimed {
                    root: fixture.root,
                    claim:
                        HostRootContainerDescendantMutationClaimForCanary::ContainerChildSetMutation,
                },
            )
        );
        assert_eq!(
            validate_host_root_container_descendant_private_scope_for_canary(
                &record
                    .clone()
                    .with_host_child_mutation_performed_for_canary(),
            ),
            Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::MutationClaimed {
                    root: fixture.root,
                    claim: HostRootContainerDescendantMutationClaimForCanary::HostChildMutation,
                },
            )
        );
        assert_eq!(
            HostRootContainerDescendantMutationClaimForCanary::AppendChildToContainerChildSet
                .as_str(),
            "append-child-to-container-child-set"
        );
        assert_eq!(
            HostRootContainerDescendantMutationClaimForCanary::ContainerChildSetMutation.as_str(),
            "container-child-set-mutation"
        );
        assert_eq!(
            HostRootContainerDescendantMutationClaimForCanary::HostChildMutation.as_str(),
            "host-child-mutation"
        );

        for (claimed, claim) in [
            (
                record
                    .clone()
                    .with_public_dom_compatibility_claimed_for_canary(),
                HostRootContainerDescendantScopeClaimForCanary::PublicDom,
            ),
            (
                record
                    .clone()
                    .with_test_renderer_compatibility_claimed_for_canary(),
                HostRootContainerDescendantScopeClaimForCanary::TestRenderer,
            ),
            (
                record
                    .clone()
                    .with_persistence_container_child_set_compatibility_claimed_for_canary(),
                HostRootContainerDescendantScopeClaimForCanary::PersistenceContainerChildSet,
            ),
            (
                record
                    .clone()
                    .with_public_root_behavior_claimed_for_canary(),
                HostRootContainerDescendantScopeClaimForCanary::PublicRootBehavior,
            ),
            (
                record
                    .clone()
                    .with_renderer_compatibility_claimed_for_canary(),
                HostRootContainerDescendantScopeClaimForCanary::RendererCompatibility,
            ),
            (
                record.with_package_compatibility_claimed_for_canary(),
                HostRootContainerDescendantScopeClaimForCanary::PackageCompatibility,
            ),
        ] {
            assert_eq!(
                validate_host_root_container_descendant_private_scope_for_canary(&claimed),
                Err(
                    HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::ScopeClaimed {
                        root: fixture.root,
                        claim,
                    },
                )
            );
        }
        assert_eq!(
            HostRootContainerDescendantScopeClaimForCanary::PublicDom.as_str(),
            "public-dom"
        );
        assert_eq!(
            HostRootContainerDescendantScopeClaimForCanary::TestRenderer.as_str(),
            "test-renderer"
        );
        assert_eq!(
            HostRootContainerDescendantScopeClaimForCanary::PersistenceContainerChildSet.as_str(),
            "persistence-container-child-set"
        );
        assert_eq!(
            HostRootContainerDescendantScopeClaimForCanary::PublicRootBehavior.as_str(),
            "public-root-behavior"
        );
        assert_eq!(
            HostRootContainerDescendantScopeClaimForCanary::RendererCompatibility.as_str(),
            "renderer-compatibility"
        );
        assert_eq!(
            HostRootContainerDescendantScopeClaimForCanary::PackageCompatibility.as_str(),
            "package-compatibility"
        );
    }

    #[test]
    fn complete_context_provider_restores_stack_and_bubbles_children() {
        let (mut arena, mut context_store, begin_work, default_value) = provider_scope();

        let record =
            complete_context_provider_for_test(&mut arena, &mut context_store, begin_work).unwrap();

        assert_eq!(record.provider(), begin_work.provider());
        assert_eq!(record.context(), begin_work.context());
        assert_eq!(record.value(), begin_work.value());
        assert_eq!(
            record.phase(),
            ContextProviderStackRestorationPhase::Complete
        );
        assert_eq!(record.stack_depth_before_restore(), 1);
        assert_eq!(record.restored_stack_depth(), 0);
        assert!(record.subtree_flags().contains_all(FiberFlags::PLACEMENT));
        assert_eq!(
            context_store.current_value(begin_work.context()).unwrap(),
            default_value
        );
        assert_eq!(context_store.stack_depth(), 0);
    }

    #[test]
    fn unwind_context_provider_restores_stack_without_bubbling() {
        let (mut arena, mut context_store, begin_work, default_value) = provider_scope();

        let record =
            unwind_context_provider_for_test(&mut arena, &mut context_store, begin_work).unwrap();

        assert_eq!(record.phase(), ContextProviderStackRestorationPhase::Unwind);
        assert_eq!(record.stack_depth_before_restore(), 1);
        assert_eq!(record.restored_stack_depth(), 0);
        assert_eq!(record.subtree_flags(), FiberFlags::NO);
        assert_eq!(
            context_store.current_value(begin_work.context()).unwrap(),
            default_value
        );
        assert_eq!(context_store.stack_depth(), 0);
    }

    #[test]
    fn complete_offscreen_visibility_transition_blocker_keeps_effects_blocked() {
        let render_lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
        let previous_lanes = Lanes::OFFSCREEN;
        let previous_child_lanes = Lanes::from(Lane::RETRY_1);
        let work_in_progress_lanes = Lanes::DEFAULT;
        let work_in_progress_child_lanes = Lanes::from(Lane::TRANSITION_1);
        let (mut arena, previous, work_in_progress, first_child, second_child) =
            offscreen_complete_transition_pair(
                "complete-hidden-panel",
                StateHandle::from_raw(904),
                StateHandle::NONE,
                previous_lanes,
                previous_child_lanes,
                work_in_progress_lanes,
                work_in_progress_child_lanes,
                false,
            );
        arena
            .get_mut(first_child)
            .unwrap()
            .merge_flags(FiberFlags::MAY_SUSPEND_COMMIT);
        let begin_work_record =
            offscreen_begin_work_visibility_record(&mut arena, work_in_progress, render_lanes);

        let record = complete_offscreen_visibility_transition_blocker_for_test(
            &arena,
            work_in_progress,
            &begin_work_record,
            render_lanes,
        )
        .unwrap();

        assert_eq!(record.offscreen(), work_in_progress);
        assert_eq!(record.child(), Some(first_child));
        assert_eq!(record.child_tag(), Some(FiberTag::HostComponent));
        assert_eq!(record.child_sibling(), second_child);
        assert_eq!(record.child_sibling_tag(), None);
        assert_eq!(record.flags(), FiberFlags::NO);
        assert_eq!(record.subtree_flags(), FiberFlags::NO);
        assert_eq!(record.feature(), OFFSCREEN_UNSUPPORTED_FEATURE);
        let transition = record.transition();
        assert!(
            record
                .begin_work_transition()
                .has_same_transition_identity(transition)
        );
        assert_eq!(
            record.begin_work_transition().child_traversal_blocker(),
            UnsupportedOffscreenVisibilityChildTraversalBlocker::BeginWorkDoesNotTraverseOffscreenChildren
        );
        assert_eq!(transition.previous(), previous);
        assert_eq!(transition.work_in_progress(), work_in_progress);
        assert_eq!(
            transition.key().map(ReactKey::as_str),
            Some("complete-hidden-panel")
        );
        assert_eq!(
            transition.mode(),
            UnsupportedOffscreenVisibilityMode::Visible
        );
        assert_eq!(
            transition.previous_visibility(),
            UnsupportedOffscreenVisibility::Hidden
        );
        assert_eq!(
            transition.current_visibility(),
            UnsupportedOffscreenVisibility::Visible
        );
        assert_eq!(
            transition.transition(),
            UnsupportedOffscreenVisibilityTransitionKind::HiddenToVisible
        );
        assert_eq!(
            transition.child_traversal_blocker(),
            UnsupportedOffscreenVisibilityChildTraversalBlocker::CompleteWorkDoesNotBubbleChildrenOrScheduleVisibility
        );
        assert_eq!(transition.render_lanes(), render_lanes);
        assert_eq!(transition.previous_lanes(), previous_lanes);
        assert_eq!(transition.previous_child_lanes(), previous_child_lanes);
        assert_eq!(transition.work_in_progress_lanes(), work_in_progress_lanes);
        assert_eq!(
            transition.work_in_progress_child_lanes(),
            work_in_progress_child_lanes
        );
        assert!(transition.render_includes_offscreen_lane());
        assert!(!transition.work_in_progress_includes_offscreen_lane());
        assert_eq!(
            record.subtree_flag_bubbling_intent(),
            OffscreenVisibilitySubtreeFlagBubblingIntent::BubbleVisibleSubtree
        );
        assert!(
            record
                .subtree_flag_bubbling_intent()
                .should_bubble_subtree_flags()
        );
        assert_eq!(
            record.subtree_flag_bubbling_intent().as_str(),
            "bubble-visible-subtree"
        );
        assert_eq!(
            record.subtree_flag_bubbling_blocker(),
            OffscreenVisibilitySubtreeFlagBubblingBlocker::CompleteWorkDoesNotApplyBubbledChildLanesOrSubtreeFlags
        );
        assert_eq!(
            record.subtree_flag_bubbling_blocker().as_str(),
            "complete-work-does-not-apply-bubbled-child-lanes-or-subtree-flags"
        );
        assert_eq!(record.candidate_child_lanes(), Lanes::NO);
        assert!(
            record
                .candidate_subtree_flags()
                .contains_all(FiberFlags::PLACEMENT | FiberFlags::MAY_SUSPEND_COMMIT)
        );
        assert!(record.would_schedule_visibility_effect());
        assert!(!record.would_schedule_visibility_for_subtree_mutation());
        assert_eq!(
            record.visibility_effect_scheduling_blocker(),
            OffscreenVisibilityEffectSchedulingBlocker::CompleteWorkDoesNotSetVisibilityFlag
        );
        assert_eq!(
            record.visibility_effect_scheduling_blocker().as_str(),
            "complete-work-does-not-set-visibility-flag"
        );
        assert!(record.child_traversal_blocked());
        assert!(record.host_mutation_blocked());
        assert!(record.public_compatibility_blocked());
        assert_eq!(arena.get(work_in_progress).unwrap().flags(), FiberFlags::NO);
        assert_eq!(
            arena.get(work_in_progress).unwrap().subtree_flags(),
            FiberFlags::NO
        );
        assert!(
            arena
                .get(first_child)
                .unwrap()
                .flags()
                .contains_all(FiberFlags::PLACEMENT)
        );
        let reveal = offscreen_reveal_commit_metadata_for_test(&record, render_lanes).unwrap();
        assert_eq!(reveal.offscreen(), work_in_progress);
        assert_eq!(reveal.child(), first_child);
        assert_eq!(reveal.child_tag(), FiberTag::HostComponent);
        assert_eq!(reveal.committed_lanes(), render_lanes);
        assert_eq!(
            reveal.transition().transition(),
            UnsupportedOffscreenVisibilityTransitionKind::HiddenToVisible
        );
        assert_eq!(
            reveal.subtree_flag_bubbling_intent(),
            OffscreenVisibilitySubtreeFlagBubblingIntent::BubbleVisibleSubtree
        );
        assert_eq!(
            reveal.status(),
            OffscreenRevealCommitMetadataStatus::AcceptedHiddenToVisibleReveal
        );
        assert_eq!(
            reveal.status().as_str(),
            "accepted-hidden-to-visible-reveal"
        );
        assert_eq!(
            reveal.suspensey_commit_flag(),
            FiberFlags::MAY_SUSPEND_COMMIT
        );
        assert!(
            reveal
                .candidate_subtree_flags()
                .contains_all(FiberFlags::PLACEMENT | FiberFlags::MAY_SUSPEND_COMMIT)
        );
        assert!(reveal.child_may_suspend_commit());
        assert!(reveal.would_accumulate_newly_visible_suspensey_commit());
        assert!(reveal.would_unhide_host_children());
        assert!(reveal.visibility_effect_required());
        assert!(!reveal.visibility_flag_set());
        assert!(reveal.host_visibility_mutation_blocked());
        assert!(reveal.passive_visibility_effects_blocked());
        assert!(reveal.public_compatibility_blocked());
        assert_eq!(reveal.feature(), OFFSCREEN_UNSUPPORTED_FEATURE);

        let render_lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
        let previous_lanes = Lanes::SYNC;
        let previous_child_lanes = Lanes::from(Lane::TRANSITION_2);
        let work_in_progress_lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
        let work_in_progress_child_lanes = Lanes::from(Lane::RETRY_2);
        let (mut arena, previous, work_in_progress, first_child, second_child) =
            offscreen_complete_transition_pair(
                "complete-visible-panel",
                StateHandle::NONE,
                StateHandle::from_raw(905),
                previous_lanes,
                previous_child_lanes,
                work_in_progress_lanes,
                work_in_progress_child_lanes,
                false,
            );
        arena
            .get_mut(first_child)
            .unwrap()
            .set_subtree_flags(FiberFlags::UPDATE);
        let begin_work_record =
            offscreen_begin_work_visibility_record(&mut arena, work_in_progress, render_lanes);

        let record = complete_offscreen_visibility_transition_blocker_for_test(
            &arena,
            work_in_progress,
            &begin_work_record,
            render_lanes,
        )
        .unwrap();

        assert_eq!(record.offscreen(), work_in_progress);
        assert_eq!(record.child(), Some(first_child));
        assert_eq!(record.child_tag(), Some(FiberTag::HostComponent));
        assert_eq!(record.child_sibling(), second_child);
        assert_eq!(record.child_sibling_tag(), None);
        assert_eq!(record.flags(), FiberFlags::NO);
        assert_eq!(record.subtree_flags(), FiberFlags::NO);
        assert_eq!(record.feature(), OFFSCREEN_UNSUPPORTED_FEATURE);
        let transition = record.transition();
        assert!(
            record
                .begin_work_transition()
                .has_same_transition_identity(transition)
        );
        assert_eq!(transition.previous(), previous);
        assert_eq!(transition.work_in_progress(), work_in_progress);
        assert_eq!(
            transition.key().map(ReactKey::as_str),
            Some("complete-visible-panel")
        );
        assert_eq!(
            transition.mode(),
            UnsupportedOffscreenVisibilityMode::Hidden
        );
        assert_eq!(
            transition.previous_visibility(),
            UnsupportedOffscreenVisibility::Visible
        );
        assert_eq!(
            transition.current_visibility(),
            UnsupportedOffscreenVisibility::Hidden
        );
        assert_eq!(
            transition.transition(),
            UnsupportedOffscreenVisibilityTransitionKind::VisibleToHidden
        );
        assert_eq!(
            transition.child_traversal_blocker(),
            UnsupportedOffscreenVisibilityChildTraversalBlocker::CompleteWorkDoesNotBubbleChildrenOrScheduleVisibility
        );
        assert_eq!(transition.render_lanes(), render_lanes);
        assert_eq!(transition.previous_lanes(), previous_lanes);
        assert_eq!(transition.previous_child_lanes(), previous_child_lanes);
        assert_eq!(transition.work_in_progress_lanes(), work_in_progress_lanes);
        assert_eq!(
            transition.work_in_progress_child_lanes(),
            work_in_progress_child_lanes
        );
        assert!(transition.render_includes_offscreen_lane());
        assert!(transition.work_in_progress_includes_offscreen_lane());
        assert_eq!(
            record.subtree_flag_bubbling_intent(),
            OffscreenVisibilitySubtreeFlagBubblingIntent::BubbleHiddenSubtreeAtOffscreenLane
        );
        assert!(
            record
                .subtree_flag_bubbling_intent()
                .should_bubble_subtree_flags()
        );
        assert_eq!(record.candidate_child_lanes(), Lanes::NO);
        assert!(
            record
                .candidate_subtree_flags()
                .contains_all(FiberFlags::PLACEMENT | FiberFlags::UPDATE)
        );
        assert!(record.would_schedule_visibility_effect());
        assert!(record.would_schedule_visibility_for_subtree_mutation());
        assert_eq!(
            record.visibility_effect_scheduling_blocker(),
            OffscreenVisibilityEffectSchedulingBlocker::CompleteWorkDoesNotSetVisibilityFlag
        );
        assert!(record.child_traversal_blocked());
        assert!(record.host_mutation_blocked());
        assert!(record.public_compatibility_blocked());
        assert!(
            !arena
                .get(work_in_progress)
                .unwrap()
                .flags()
                .contains_any(FiberFlags::VISIBILITY)
        );
        assert_eq!(
            arena.get(work_in_progress).unwrap().subtree_flags(),
            FiberFlags::NO
        );
        assert!(
            arena
                .get(first_child)
                .unwrap()
                .flags()
                .contains_all(FiberFlags::PLACEMENT)
        );
        assert_eq!(
            offscreen_reveal_commit_metadata_for_test(&record, render_lanes),
            Err(
                OffscreenRevealCommitMetadataError::UnsupportedVisibilityTransition {
                    offscreen: work_in_progress,
                    transition: UnsupportedOffscreenVisibilityTransitionKind::VisibleToHidden,
                },
            )
        );
    }

    #[test]
    fn complete_offscreen_hidden_update_defers_subtree_until_offscreen_lane() {
        let render_lanes = Lanes::DEFAULT;
        let previous_lanes = Lanes::SYNC;
        let previous_child_lanes = Lanes::NO;
        let work_in_progress_lanes = Lanes::DEFAULT;
        let work_in_progress_child_lanes = Lanes::DEFAULT;
        let (mut arena, previous, work_in_progress, first_child, second_child) =
            offscreen_complete_transition_pair(
                "complete-deferred-hidden-update",
                StateHandle::NONE,
                StateHandle::from_raw(9_061),
                previous_lanes,
                previous_child_lanes,
                work_in_progress_lanes,
                work_in_progress_child_lanes,
                false,
            );
        {
            let child = arena.get_mut(first_child).unwrap();
            child.set_lanes(Lanes::DEFAULT);
            child.set_subtree_flags(FiberFlags::UPDATE);
        }
        let begin_work_record =
            offscreen_begin_work_visibility_record(&mut arena, work_in_progress, render_lanes);

        let record = complete_offscreen_visibility_transition_blocker_for_test(
            &arena,
            work_in_progress,
            &begin_work_record,
            render_lanes,
        )
        .unwrap();

        assert_eq!(record.offscreen(), work_in_progress);
        assert_eq!(record.child(), Some(first_child));
        assert_eq!(record.child_tag(), Some(FiberTag::HostComponent));
        assert_eq!(record.child_sibling(), second_child);
        let transition = record.transition();
        assert!(
            record
                .begin_work_transition()
                .has_same_transition_identity(transition)
        );
        assert_eq!(transition.previous(), previous);
        assert_eq!(transition.work_in_progress(), work_in_progress);
        assert_eq!(
            transition.key().map(ReactKey::as_str),
            Some("complete-deferred-hidden-update")
        );
        assert_eq!(
            transition.transition(),
            UnsupportedOffscreenVisibilityTransitionKind::VisibleToHidden
        );
        assert_eq!(
            transition.child_traversal_blocker(),
            UnsupportedOffscreenVisibilityChildTraversalBlocker::CompleteWorkDoesNotBubbleChildrenOrScheduleVisibility
        );
        assert_eq!(transition.render_lanes(), render_lanes);
        assert_eq!(transition.previous_lanes(), previous_lanes);
        assert_eq!(transition.previous_child_lanes(), previous_child_lanes);
        assert_eq!(transition.work_in_progress_lanes(), work_in_progress_lanes);
        assert_eq!(
            transition.work_in_progress_child_lanes(),
            work_in_progress_child_lanes
        );
        assert!(!transition.render_includes_offscreen_lane());
        assert!(!transition.work_in_progress_includes_offscreen_lane());
        assert!(!transition.records_offscreen_lane_participation());
        assert_eq!(
            record.subtree_flag_bubbling_intent(),
            OffscreenVisibilitySubtreeFlagBubblingIntent::DeferHiddenSubtreeUntilOffscreenLane
        );
        assert!(
            !record
                .subtree_flag_bubbling_intent()
                .should_bubble_subtree_flags()
        );
        assert_eq!(
            record.subtree_flag_bubbling_intent().as_str(),
            "defer-hidden-subtree-until-offscreen-lane"
        );
        assert_eq!(record.candidate_child_lanes(), Lanes::DEFAULT);
        assert!(
            record
                .candidate_subtree_flags()
                .contains_all(FiberFlags::PLACEMENT | FiberFlags::UPDATE)
        );
        assert!(record.would_schedule_visibility_effect());
        assert!(!record.would_schedule_visibility_for_subtree_mutation());
        assert!(record.child_traversal_blocked());
        assert!(record.host_mutation_blocked());
        assert!(record.public_compatibility_blocked());
        assert_eq!(
            arena.get(work_in_progress).unwrap().subtree_flags(),
            FiberFlags::NO
        );
        assert_eq!(
            offscreen_reveal_commit_metadata_for_test(&record, render_lanes),
            Err(
                OffscreenRevealCommitMetadataError::UnsupportedVisibilityTransition {
                    offscreen: work_in_progress,
                    transition: UnsupportedOffscreenVisibilityTransitionKind::VisibleToHidden,
                },
            )
        );
    }

    #[test]
    fn complete_offscreen_visibility_transition_blocker_rejects_shapes_and_stale_begin_work() {
        let render_lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
        let (mut arena, _, work_in_progress, _, _) = offscreen_complete_transition_pair(
            "complete-multiple-panel",
            StateHandle::from_raw(906),
            StateHandle::NONE,
            Lanes::OFFSCREEN,
            Lanes::NO,
            Lanes::DEFAULT,
            Lanes::NO,
            true,
        );
        let begin_work_record =
            offscreen_begin_work_visibility_record(&mut arena, work_in_progress, render_lanes);

        assert_eq!(
            complete_offscreen_visibility_transition_blocker_for_test(
                &arena,
                work_in_progress,
                &begin_work_record,
                render_lanes,
            ),
            Err(
                OffscreenVisibilityTransitionCompleteWorkBlockerError::UnsupportedOffscreenShape {
                    offscreen: work_in_progress,
                    shape: UnsupportedOffscreenChildShapeKind::MultipleChildren,
                },
            )
        );

        let (mut arena, _, work_in_progress, _, _) = offscreen_complete_transition_pair(
            "complete-stale-panel",
            StateHandle::from_raw(907),
            StateHandle::NONE,
            Lanes::OFFSCREEN,
            Lanes::NO,
            Lanes::DEFAULT,
            Lanes::NO,
            false,
        );
        let begin_work_record =
            offscreen_begin_work_visibility_record(&mut arena, work_in_progress, render_lanes);
        arena
            .get_mut(work_in_progress)
            .unwrap()
            .set_lanes(Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN));

        match complete_offscreen_visibility_transition_blocker_for_test(
            &arena,
            work_in_progress,
            &begin_work_record,
            render_lanes,
        ) {
            Err(
                OffscreenVisibilityTransitionCompleteWorkBlockerError::StaleBeginWorkVisibilityTransition {
                    offscreen,
                    begin_work_transition,
                    complete_work_transition,
                },
            ) => {
                assert_eq!(offscreen, work_in_progress);
                assert_eq!(begin_work_transition.work_in_progress(), work_in_progress);
                assert_eq!(complete_work_transition.work_in_progress(), work_in_progress);
                assert!(!begin_work_transition.has_same_transition_identity(
                    &complete_work_transition
                ));
                assert!(!begin_work_transition.work_in_progress_includes_offscreen_lane());
                assert!(complete_work_transition.work_in_progress_includes_offscreen_lane());
            }
            other => panic!("expected stale begin-work transition record, got {other:?}"),
        }
    }

    #[test]
    fn complete_managed_child_records_one_new_host_component_placement() {
        let (arena, fixture) = managed_child_placement_complete_fixture();

        let record = host_component_managed_child_complete_work_record_for_canary(
            &arena,
            fixture.root,
            fixture.parent_work_in_progress,
            fixture.child,
            HostComponentManagedChildMutationKindForCanary::Placement,
        )
        .unwrap();

        assert_eq!(record.root(), fixture.root);
        assert_eq!(
            record.kind(),
            HostComponentManagedChildMutationKindForCanary::Placement
        );
        assert_eq!(record.kind_name(), "managed-child-placement");
        assert_eq!(record.parent_current(), fixture.parent_current);
        assert_eq!(
            record.parent_work_in_progress(),
            fixture.parent_work_in_progress
        );
        assert_eq!(record.parent_state_node(), fixture.parent_state_node);
        assert_eq!(record.parent_flags(), FiberFlags::NO);
        assert_eq!(record.child(), fixture.child);
        assert_eq!(record.child_tag(), FiberTag::HostComponent);
        assert_eq!(record.child_state_node(), fixture.child_state_node);
        assert_eq!(record.child_pending_props(), fixture.child_props);
        assert_eq!(record.child_memoized_props(), fixture.child_props);
        assert_eq!(record.child_alternate(), None);
        assert_eq!(record.child_flags(), FiberFlags::PLACEMENT);
        assert_eq!(record.deletion_list(), None);
        assert_eq!(record.expected_effect_flag(), FiberFlags::PLACEMENT);
        assert!(record.private_reconciler_handoff_only());
        assert!(!record.public_dom_compatibility_claimed());
        assert!(!record.test_renderer_compatibility_claimed());
        assert!(!record.broad_reconciliation_traversal_claimed());
    }

    #[test]
    fn complete_managed_child_records_one_deleted_host_component_detach() {
        let (arena, fixture) = managed_child_delete_complete_fixture();

        let record = host_component_managed_child_complete_work_record_for_canary(
            &arena,
            fixture.root,
            fixture.parent_work_in_progress,
            fixture.child,
            HostComponentManagedChildMutationKindForCanary::DeleteDetach,
        )
        .unwrap();

        assert_eq!(record.root(), fixture.root);
        assert_eq!(
            record.kind(),
            HostComponentManagedChildMutationKindForCanary::DeleteDetach
        );
        assert_eq!(record.kind_name(), "managed-child-delete-detach");
        assert_eq!(record.parent_current(), fixture.parent_current);
        assert_eq!(
            record.parent_work_in_progress(),
            fixture.parent_work_in_progress
        );
        assert_eq!(record.parent_state_node(), fixture.parent_state_node);
        assert_eq!(record.parent_flags(), FiberFlags::CHILD_DELETION);
        assert_eq!(record.child(), fixture.child);
        assert_eq!(record.child_tag(), FiberTag::HostComponent);
        assert_eq!(record.child_state_node(), fixture.child_state_node);
        assert_eq!(record.child_pending_props(), fixture.child_props);
        assert_eq!(record.child_memoized_props(), fixture.child_props);
        assert_eq!(record.child_alternate(), None);
        assert_eq!(record.child_flags(), FiberFlags::NO);
        assert_eq!(record.deletion_list(), fixture.deletion_list);
        assert_eq!(record.expected_effect_flag(), FiberFlags::CHILD_DELETION);
        assert!(record.private_reconciler_handoff_only());
        assert!(!record.public_dom_compatibility_claimed());
        assert!(!record.test_renderer_compatibility_claimed());
        assert!(!record.broad_reconciliation_traversal_claimed());
    }

    #[test]
    fn complete_managed_child_records_one_new_host_text_placement() {
        let (arena, fixture) = managed_child_placement_text_complete_fixture();

        let record = host_component_managed_child_complete_work_record_for_canary(
            &arena,
            fixture.root,
            fixture.parent_work_in_progress,
            fixture.child,
            HostComponentManagedChildMutationKindForCanary::Placement,
        )
        .unwrap();

        assert_eq!(record.root(), fixture.root);
        assert_eq!(
            record.kind(),
            HostComponentManagedChildMutationKindForCanary::Placement
        );
        assert_eq!(record.parent_current(), fixture.parent_current);
        assert_eq!(
            record.parent_work_in_progress(),
            fixture.parent_work_in_progress
        );
        assert_eq!(record.parent_state_node(), fixture.parent_state_node);
        assert_eq!(record.parent_flags(), FiberFlags::NO);
        assert_eq!(record.child(), fixture.child);
        assert_eq!(record.child_tag(), FiberTag::HostText);
        assert_eq!(record.child_state_node(), fixture.child_state_node);
        assert_eq!(record.child_pending_props(), fixture.child_props);
        assert_eq!(record.child_memoized_props(), fixture.child_props);
        assert_eq!(record.child_alternate(), None);
        assert_eq!(record.child_flags(), FiberFlags::PLACEMENT);
        assert_eq!(record.deletion_list(), None);
        assert_eq!(record.expected_effect_flag(), FiberFlags::PLACEMENT);
        assert!(record.private_reconciler_handoff_only());
        assert!(!record.public_dom_compatibility_claimed());
        assert!(!record.test_renderer_compatibility_claimed());
        assert!(!record.broad_reconciliation_traversal_claimed());
    }

    #[test]
    fn complete_managed_child_records_one_deleted_host_text_detach() {
        let (arena, fixture) = managed_child_delete_text_complete_fixture();

        let record = host_component_managed_child_complete_work_record_for_canary(
            &arena,
            fixture.root,
            fixture.parent_work_in_progress,
            fixture.child,
            HostComponentManagedChildMutationKindForCanary::DeleteDetach,
        )
        .unwrap();

        assert_eq!(record.root(), fixture.root);
        assert_eq!(
            record.kind(),
            HostComponentManagedChildMutationKindForCanary::DeleteDetach
        );
        assert_eq!(record.parent_current(), fixture.parent_current);
        assert_eq!(
            record.parent_work_in_progress(),
            fixture.parent_work_in_progress
        );
        assert_eq!(record.parent_state_node(), fixture.parent_state_node);
        assert_eq!(record.parent_flags(), FiberFlags::CHILD_DELETION);
        assert_eq!(record.child(), fixture.child);
        assert_eq!(record.child_tag(), FiberTag::HostText);
        assert_eq!(record.child_state_node(), fixture.child_state_node);
        assert_eq!(record.child_pending_props(), fixture.child_props);
        assert_eq!(record.child_memoized_props(), fixture.child_props);
        assert_eq!(record.child_alternate(), None);
        assert_eq!(record.child_flags(), FiberFlags::NO);
        assert_eq!(record.deletion_list(), fixture.deletion_list);
        assert_eq!(record.expected_effect_flag(), FiberFlags::CHILD_DELETION);
        assert!(record.private_reconciler_handoff_only());
        assert!(!record.public_dom_compatibility_claimed());
        assert!(!record.test_renderer_compatibility_claimed());
        assert!(!record.broad_reconciliation_traversal_claimed());
    }

    #[test]
    fn complete_managed_child_sibling_order_records_host_component_placement_before_sibling() {
        let (arena, fixture) = managed_child_placement_sibling_order_complete_fixture();
        let order_sibling = fixture.order_sibling.unwrap();
        let order_sibling_current = fixture.order_sibling_current.unwrap();

        let record = host_component_managed_child_sibling_order_complete_work_record_for_canary(
            &arena,
            fixture.root,
            fixture.parent_work_in_progress,
            fixture.child,
            order_sibling,
            HostComponentManagedChildMutationKindForCanary::Placement,
        )
        .unwrap();

        assert_eq!(record.root(), fixture.root);
        assert_eq!(
            record.kind(),
            HostComponentManagedChildMutationKindForCanary::Placement
        );
        assert_eq!(record.kind_name(), "managed-child-placement");
        assert_eq!(record.order_evidence_name(), "next-sibling");
        assert_eq!(record.parent_current(), fixture.parent_current);
        assert_eq!(
            record.parent_work_in_progress(),
            fixture.parent_work_in_progress
        );
        assert_eq!(record.parent_state_node(), fixture.parent_state_node);
        assert_eq!(record.parent_flags(), FiberFlags::NO);
        assert_eq!(record.child(), fixture.child);
        assert_eq!(record.child_tag(), FiberTag::HostComponent);
        assert_eq!(record.child_state_node(), fixture.child_state_node);
        assert_eq!(record.child_pending_props(), fixture.child_props);
        assert_eq!(record.child_memoized_props(), fixture.child_props);
        assert_eq!(record.child_alternate(), None);
        assert_eq!(record.child_flags(), FiberFlags::PLACEMENT);
        assert_eq!(record.order_sibling(), order_sibling);
        assert_eq!(record.order_sibling_tag(), FiberTag::HostComponent);
        assert_eq!(
            record.order_sibling_state_node(),
            fixture.order_sibling_state_node
        );
        assert_eq!(
            record.order_sibling_pending_props(),
            fixture.order_sibling_props
        );
        assert_eq!(
            record.order_sibling_memoized_props(),
            fixture.order_sibling_props
        );
        assert_eq!(
            record.order_sibling_alternate(),
            Some(order_sibling_current)
        );
        assert_eq!(record.order_sibling_flags(), FiberFlags::NO);
        assert_eq!(record.deletion_list(), None);
        assert_eq!(record.expected_effect_flag(), FiberFlags::PLACEMENT);
        assert!(record.private_reconciler_handoff_only());
        assert!(!record.public_dom_compatibility_claimed());
        assert!(!record.test_renderer_compatibility_claimed());
        assert!(!record.broad_reconciliation_traversal_claimed());
    }

    #[test]
    fn complete_managed_child_sibling_order_records_host_text_placement_before_text_sibling() {
        let (arena, fixture) = managed_child_text_placement_sibling_order_complete_fixture();
        let order_sibling = fixture.order_sibling.unwrap();
        let order_sibling_current = fixture.order_sibling_current.unwrap();

        let record = host_component_managed_child_sibling_order_complete_work_record_for_canary(
            &arena,
            fixture.root,
            fixture.parent_work_in_progress,
            fixture.child,
            order_sibling,
            HostComponentManagedChildMutationKindForCanary::Placement,
        )
        .unwrap();

        assert_eq!(record.root(), fixture.root);
        assert_eq!(
            record.kind(),
            HostComponentManagedChildMutationKindForCanary::Placement
        );
        assert_eq!(record.order_evidence_name(), "next-sibling");
        assert_eq!(record.parent_current(), fixture.parent_current);
        assert_eq!(
            record.parent_work_in_progress(),
            fixture.parent_work_in_progress
        );
        assert_eq!(record.parent_state_node(), fixture.parent_state_node);
        assert_eq!(record.parent_flags(), FiberFlags::NO);
        assert_eq!(record.child(), fixture.child);
        assert_eq!(record.child_tag(), FiberTag::HostText);
        assert_eq!(record.child_state_node(), fixture.child_state_node);
        assert_eq!(record.child_pending_props(), fixture.child_props);
        assert_eq!(record.child_memoized_props(), fixture.child_props);
        assert_eq!(record.child_alternate(), None);
        assert_eq!(record.child_flags(), FiberFlags::PLACEMENT);
        assert_eq!(record.order_sibling(), order_sibling);
        assert_eq!(record.order_sibling_tag(), FiberTag::HostText);
        assert_eq!(
            record.order_sibling_state_node(),
            fixture.order_sibling_state_node
        );
        assert_eq!(
            record.order_sibling_pending_props(),
            fixture.order_sibling_props
        );
        assert_eq!(
            record.order_sibling_memoized_props(),
            fixture.order_sibling_props
        );
        assert_eq!(
            record.order_sibling_alternate(),
            Some(order_sibling_current)
        );
        assert_eq!(record.order_sibling_flags(), FiberFlags::NO);
        assert_eq!(record.deletion_list(), None);
        assert_eq!(record.expected_effect_flag(), FiberFlags::PLACEMENT);
        assert!(record.private_reconciler_handoff_only());
        assert!(!record.public_dom_compatibility_claimed());
        assert!(!record.test_renderer_compatibility_claimed());
        assert!(!record.broad_reconciliation_traversal_claimed());
    }

    #[test]
    fn complete_managed_child_sibling_order_records_host_component_delete_after_previous_sibling() {
        let (arena, fixture) = managed_child_delete_sibling_order_complete_fixture();
        let order_sibling = fixture.order_sibling.unwrap();
        let order_sibling_current = fixture.order_sibling_current.unwrap();

        let record = host_component_managed_child_sibling_order_complete_work_record_for_canary(
            &arena,
            fixture.root,
            fixture.parent_work_in_progress,
            fixture.child,
            order_sibling,
            HostComponentManagedChildMutationKindForCanary::DeleteDetach,
        )
        .unwrap();

        assert_eq!(record.root(), fixture.root);
        assert_eq!(
            record.kind(),
            HostComponentManagedChildMutationKindForCanary::DeleteDetach
        );
        assert_eq!(record.kind_name(), "managed-child-delete-detach");
        assert_eq!(record.order_evidence_name(), "previous-sibling");
        assert_eq!(record.parent_current(), fixture.parent_current);
        assert_eq!(
            record.parent_work_in_progress(),
            fixture.parent_work_in_progress
        );
        assert_eq!(record.parent_state_node(), fixture.parent_state_node);
        assert_eq!(record.parent_flags(), FiberFlags::CHILD_DELETION);
        assert_eq!(record.child(), fixture.child);
        assert_eq!(record.child_tag(), FiberTag::HostComponent);
        assert_eq!(record.child_state_node(), fixture.child_state_node);
        assert_eq!(record.child_pending_props(), fixture.child_props);
        assert_eq!(record.child_memoized_props(), fixture.child_props);
        assert_eq!(record.child_alternate(), None);
        assert_eq!(record.child_flags(), FiberFlags::NO);
        assert_eq!(record.order_sibling(), order_sibling);
        assert_eq!(record.order_sibling_tag(), FiberTag::HostComponent);
        assert_eq!(
            record.order_sibling_state_node(),
            fixture.order_sibling_state_node
        );
        assert_eq!(
            record.order_sibling_pending_props(),
            fixture.order_sibling_props
        );
        assert_eq!(
            record.order_sibling_memoized_props(),
            fixture.order_sibling_props
        );
        assert_eq!(
            record.order_sibling_alternate(),
            Some(order_sibling_current)
        );
        assert_eq!(record.order_sibling_flags(), FiberFlags::NO);
        assert_eq!(record.deletion_list(), fixture.deletion_list);
        assert_eq!(record.expected_effect_flag(), FiberFlags::CHILD_DELETION);
        assert!(record.private_reconciler_handoff_only());
        assert!(!record.public_dom_compatibility_claimed());
        assert!(!record.test_renderer_compatibility_claimed());
        assert!(!record.broad_reconciliation_traversal_claimed());
    }

    #[test]
    fn complete_managed_child_sibling_order_rejects_foreign_or_pending_sibling() {
        let (mut arena, fixture) = managed_child_placement_sibling_order_complete_fixture();
        let order_sibling = fixture.order_sibling.unwrap();
        arena
            .get_mut(order_sibling)
            .unwrap()
            .merge_flags(FiberFlags::PLACEMENT);

        assert_eq!(
            host_component_managed_child_sibling_order_complete_work_record_for_canary(
                &arena,
                fixture.root,
                fixture.parent_work_in_progress,
                fixture.child,
                order_sibling,
                HostComponentManagedChildMutationKindForCanary::Placement,
            ),
            Err(
                HostComponentManagedChildCompleteWorkErrorForCanary::OrderSiblingStillBeingPlaced {
                    order_sibling,
                    flags: FiberFlags::PLACEMENT,
                },
            )
        );

        let (mut arena, fixture) = managed_child_placement_sibling_order_complete_fixture();
        let foreign_order_sibling = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(20_601),
            FiberMode::NO,
        );
        arena
            .get_mut(foreign_order_sibling)
            .unwrap()
            .set_state_node(StateNodeHandle::from_raw(20_602));

        assert_eq!(
            host_component_managed_child_sibling_order_complete_work_record_for_canary(
                &arena,
                fixture.root,
                fixture.parent_work_in_progress,
                fixture.child,
                foreign_order_sibling,
                HostComponentManagedChildMutationKindForCanary::Placement,
            ),
            Err(
                HostComponentManagedChildCompleteWorkErrorForCanary::OrderSiblingParentMismatch {
                    parent_work_in_progress: fixture.parent_work_in_progress,
                    order_sibling: foreign_order_sibling,
                    actual_parent: None,
                },
            )
        );
    }

    #[test]
    fn complete_managed_child_sibling_order_rejects_tampered_child_order() {
        let (mut arena, fixture) = managed_child_placement_sibling_order_complete_fixture();
        let order_sibling = fixture.order_sibling.unwrap();
        arena
            .set_children(
                fixture.parent_work_in_progress,
                &[order_sibling, fixture.child],
            )
            .unwrap();

        assert_eq!(
            host_component_managed_child_sibling_order_complete_work_record_for_canary(
                &arena,
                fixture.root,
                fixture.parent_work_in_progress,
                fixture.child,
                order_sibling,
                HostComponentManagedChildMutationKindForCanary::Placement,
            ),
            Err(
                HostComponentManagedChildCompleteWorkErrorForCanary::SiblingOrderShapeMismatch {
                    parent_work_in_progress: fixture.parent_work_in_progress,
                    child: fixture.child,
                    order_sibling,
                    kind: HostComponentManagedChildMutationKindForCanary::Placement,
                    reason: "placed child must be first finished child",
                },
            )
        );
    }

    #[test]
    fn complete_managed_child_sibling_order_rejects_missing_placement_effect() {
        let (mut arena, fixture) = managed_child_placement_sibling_order_complete_fixture();
        let order_sibling = fixture.order_sibling.unwrap();
        arena
            .get_mut(fixture.child)
            .unwrap()
            .set_flags(FiberFlags::NO);

        assert_eq!(
            host_component_managed_child_sibling_order_complete_work_record_for_canary(
                &arena,
                fixture.root,
                fixture.parent_work_in_progress,
                fixture.child,
                order_sibling,
                HostComponentManagedChildMutationKindForCanary::Placement,
            ),
            Err(
                HostComponentManagedChildCompleteWorkErrorForCanary::MissingPlacementFlag {
                    child: fixture.child,
                    flags: FiberFlags::NO,
                },
            )
        );
    }

    #[test]
    fn complete_managed_child_rejects_non_host_child_and_sibling_shapes() {
        let (mut arena, fixture) = managed_child_placement_complete_fixture();
        let function_child = arena.create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(20_201),
            FiberMode::NO,
        );
        arena
            .set_children(fixture.parent_work_in_progress, &[function_child])
            .unwrap();

        assert_eq!(
            host_component_managed_child_complete_work_record_for_canary(
                &arena,
                fixture.root,
                fixture.parent_work_in_progress,
                function_child,
                HostComponentManagedChildMutationKindForCanary::Placement,
            ),
            Err(
                HostComponentManagedChildCompleteWorkErrorForCanary::ExpectedManagedHostChild {
                    child: function_child,
                    tag: FiberTag::FunctionComponent,
                },
            )
        );

        let (mut arena, fixture) = managed_child_placement_complete_fixture();
        let sibling = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(20_202),
            FiberMode::NO,
        );
        arena
            .set_children(fixture.parent_work_in_progress, &[fixture.child, sibling])
            .unwrap();

        assert_eq!(
            host_component_managed_child_complete_work_record_for_canary(
                &arena,
                fixture.root,
                fixture.parent_work_in_progress,
                fixture.child,
                HostComponentManagedChildMutationKindForCanary::Placement,
            ),
            Err(
                HostComponentManagedChildCompleteWorkErrorForCanary::UnexpectedChildSibling {
                    parent_work_in_progress: fixture.parent_work_in_progress,
                    child: fixture.child,
                    sibling,
                },
            )
        );
    }

    #[test]
    fn complete_managed_child_rejects_final_child_in_multi_child_parent() {
        let (mut arena, fixture) = managed_child_placement_complete_fixture();
        let first_child = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(20_203),
            FiberMode::NO,
        );
        {
            let node = arena.get_mut(first_child).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
            node.set_state_node(StateNodeHandle::from_raw(20_204));
            node.set_memoized_props(PropsHandle::from_raw(20_203));
        }
        arena
            .set_children(
                fixture.parent_work_in_progress,
                &[first_child, fixture.child],
            )
            .unwrap();

        assert_eq!(
            host_component_managed_child_complete_work_record_for_canary(
                &arena,
                fixture.root,
                fixture.parent_work_in_progress,
                fixture.child,
                HostComponentManagedChildMutationKindForCanary::Placement,
            ),
            Err(
                HostComponentManagedChildCompleteWorkErrorForCanary::UnexpectedParentFirstChild {
                    parent_work_in_progress: fixture.parent_work_in_progress,
                    child: fixture.child,
                    first_child,
                },
            )
        );
    }

    #[test]
    fn complete_managed_child_rejects_missing_placement_flag_and_deletion_list_mismatch() {
        let (mut arena, fixture) = managed_child_placement_complete_fixture();
        arena
            .get_mut(fixture.child)
            .unwrap()
            .set_flags(FiberFlags::NO);

        assert_eq!(
            host_component_managed_child_complete_work_record_for_canary(
                &arena,
                fixture.root,
                fixture.parent_work_in_progress,
                fixture.child,
                HostComponentManagedChildMutationKindForCanary::Placement,
            ),
            Err(
                HostComponentManagedChildCompleteWorkErrorForCanary::MissingPlacementFlag {
                    child: fixture.child,
                    flags: FiberFlags::NO,
                },
            )
        );

        let (mut arena, fixture) = managed_child_delete_complete_fixture();
        let wrong_child = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(20_301),
            FiberMode::NO,
        );
        arena
            .get_mut(wrong_child)
            .unwrap()
            .set_state_node(StateNodeHandle::from_raw(20_302));
        arena
            .set_children(fixture.parent_work_in_progress, &[wrong_child])
            .unwrap();

        assert_eq!(
            host_component_managed_child_complete_work_record_for_canary(
                &arena,
                fixture.root,
                fixture.parent_work_in_progress,
                wrong_child,
                HostComponentManagedChildMutationKindForCanary::DeleteDetach,
            ),
            Err(
                HostComponentManagedChildCompleteWorkErrorForCanary::DeletionListChildMismatch {
                    parent_work_in_progress: fixture.parent_work_in_progress,
                    deletion_list: fixture.deletion_list.unwrap(),
                    expected_child: wrong_child,
                    actual_child: fixture.child,
                },
            )
        );
    }

    #[test]
    fn complete_managed_child_rejects_deleted_child_still_in_finished_children() {
        let (mut arena, fixture) = managed_child_delete_complete_fixture();
        arena
            .set_children(fixture.parent_work_in_progress, &[fixture.child])
            .unwrap();

        assert_eq!(
            host_component_managed_child_complete_work_record_for_canary(
                &arena,
                fixture.root,
                fixture.parent_work_in_progress,
                fixture.child,
                HostComponentManagedChildMutationKindForCanary::DeleteDetach,
            ),
            Err(
                HostComponentManagedChildCompleteWorkErrorForCanary::DeletedChildStillInFinishedChildren {
                    parent_work_in_progress: fixture.parent_work_in_progress,
                    child: fixture.child,
                },
            )
        );
    }

    #[test]
    fn complete_host_root_one_level_child_set_bubbles_multiple_host_children() {
        let mut arena = FiberArena::new();
        let host_root =
            arena.create_fiber(FiberTag::HostRoot, None, PropsHandle::NONE, FiberMode::NO);
        let first = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(20),
            FiberMode::NO,
        );
        let second = arena.create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(21),
            FiberMode::NO,
        );
        arena.set_children(host_root, &[first, second]).unwrap();
        arena.get_mut(first).unwrap().set_lanes(Lanes::DEFAULT);
        arena
            .get_mut(second)
            .unwrap()
            .merge_flags(FiberFlags::PLACEMENT);

        let record =
            complete_host_root_one_level_child_set_for_test(&mut arena, host_root, 2).unwrap();

        assert_eq!(record.host_root(), host_root);
        assert_eq!(record.child_count(), 2);
        assert_eq!(record.first_child(), first);
        assert_eq!(record.first_child_tag(), FiberTag::HostComponent);
        assert_eq!(record.last_child(), second);
        assert_eq!(record.last_child_tag(), FiberTag::HostText);
        assert_eq!(record.child_lanes(), Lanes::DEFAULT);
        assert!(record.subtree_flags().contains_all(FiberFlags::PLACEMENT));
        assert_eq!(arena.get(first).unwrap().sibling(), Some(second));
        assert_eq!(arena.get(second).unwrap().sibling(), None);

        let root_node = arena.get(host_root).unwrap();
        assert_eq!(root_node.child_lanes(), Lanes::DEFAULT);
        assert!(
            root_node
                .subtree_flags()
                .contains_all(FiberFlags::PLACEMENT)
        );
    }

    #[test]
    fn complete_host_root_one_level_child_set_fails_closed_for_invalid_shape() {
        let mut non_root_arena = FiberArena::new();
        let non_root = non_root_arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        assert_eq!(
            complete_host_root_one_level_child_set_for_test(&mut non_root_arena, non_root, 2),
            Err(
                HostRootOneLevelChildSetCompletionError::UnexpectedHostRootTag {
                    fiber: non_root,
                    tag: FiberTag::HostComponent,
                },
            )
        );

        let mut count_arena = FiberArena::new();
        let host_root =
            count_arena.create_fiber(FiberTag::HostRoot, None, PropsHandle::NONE, FiberMode::NO);
        let only_child =
            count_arena.create_fiber(FiberTag::HostText, None, PropsHandle::NONE, FiberMode::NO);
        count_arena.set_children(host_root, &[only_child]).unwrap();
        assert_eq!(
            complete_host_root_one_level_child_set_for_test(&mut count_arena, host_root, 2),
            Err(
                HostRootOneLevelChildSetCompletionError::ChildCountMismatch {
                    host_root,
                    expected: 2,
                    actual: 1,
                },
            )
        );

        let mut unsupported_arena = FiberArena::new();
        let unsupported_root = unsupported_arena.create_fiber(
            FiberTag::HostRoot,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        let unsupported_child = unsupported_arena.create_fiber(
            FiberTag::Fragment,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        let host_child = unsupported_arena.create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        unsupported_arena
            .set_children(unsupported_root, &[unsupported_child, host_child])
            .unwrap();
        assert_eq!(
            complete_host_root_one_level_child_set_for_test(
                &mut unsupported_arena,
                unsupported_root,
                2,
            ),
            Err(
                HostRootOneLevelChildSetCompletionError::UnsupportedChildTag {
                    host_root: unsupported_root,
                    child: unsupported_child,
                    tag: FiberTag::Fragment,
                },
            )
        );
        assert_eq!(
            unsupported_arena
                .get(unsupported_root)
                .unwrap()
                .subtree_flags(),
            FiberFlags::NO
        );
    }
}
