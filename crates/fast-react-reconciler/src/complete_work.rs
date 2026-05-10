//! Private test-only complete/unwind helpers.
//!
//! These helpers model only the Provider stack restoration point needed by
//! root-loop canaries. They do not implement general complete-work traversal,
//! arrays, keyed children, portals, Suspense, commit, or renderer output.

#![cfg(test)]
#![allow(dead_code)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    ContextHandle, ContextStackError, ContextStackSnapshot, ContextValueHandle, FiberArena,
    FiberFlags, FiberId, FiberTag, FiberTopologyError, Lanes, bubble_properties,
};

use crate::begin_work::ContextProviderUseContextOpenScopeBeginWorkRecord;
use crate::function_component::FunctionComponentContextRenderStore;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum ContextProviderStackRestorationPhase {
    Complete,
    Unwind,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderStackRestorationRecord {
    provider: FiberId,
    context: ContextHandle,
    value: ContextValueHandle,
    provider_snapshot: ContextStackSnapshot,
    phase: ContextProviderStackRestorationPhase,
    stack_depth_before_restore: usize,
    restored_stack_depth: usize,
    child_lanes: Lanes,
    subtree_flags: FiberFlags,
}

impl ContextProviderStackRestorationRecord {
    #[must_use]
    pub const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub const fn value(self) -> ContextValueHandle {
        self.value
    }

    #[must_use]
    pub const fn provider_snapshot(self) -> ContextStackSnapshot {
        self.provider_snapshot
    }

    #[must_use]
    pub const fn phase(self) -> ContextProviderStackRestorationPhase {
        self.phase
    }

    #[must_use]
    pub const fn stack_depth_before_restore(self) -> usize {
        self.stack_depth_before_restore
    }

    #[must_use]
    pub const fn restored_stack_depth(self) -> usize {
        self.restored_stack_depth
    }

    #[must_use]
    pub const fn child_lanes(self) -> Lanes {
        self.child_lanes
    }

    #[must_use]
    pub const fn subtree_flags(self) -> FiberFlags {
        self.subtree_flags
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum ContextProviderStackRestorationError {
    FiberTopology(FiberTopologyError),
    UnexpectedFiberTag {
        fiber: FiberId,
        tag: FiberTag,
    },
    ContextRestore {
        provider: FiberId,
        context: ContextHandle,
        snapshot: ContextStackSnapshot,
        error: Box<ContextStackError>,
    },
}

impl Display for ContextProviderStackRestorationError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::UnexpectedFiberTag { fiber, tag } => write!(
                formatter,
                "fiber {} must be ContextProvider for private provider stack restoration, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::ContextRestore {
                provider,
                context,
                snapshot,
                error,
            } => write!(
                formatter,
                "ContextProvider fiber {} could not restore context {} snapshot at depth {} during private complete/unwind: {error}",
                provider.slot().get(),
                context.raw(),
                snapshot.depth()
            ),
        }
    }
}

impl Error for ContextProviderStackRestorationError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::ContextRestore { error, .. } => Some(error),
            Self::UnexpectedFiberTag { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for ContextProviderStackRestorationError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

pub(crate) fn complete_context_provider_for_test(
    arena: &mut FiberArena,
    context_store: &mut FunctionComponentContextRenderStore,
    begin_work: ContextProviderUseContextOpenScopeBeginWorkRecord,
) -> Result<ContextProviderStackRestorationRecord, ContextProviderStackRestorationError> {
    restore_context_provider_stack_for_test(
        arena,
        context_store,
        begin_work,
        ContextProviderStackRestorationPhase::Complete,
        true,
    )
}

pub(crate) fn unwind_context_provider_for_test(
    arena: &mut FiberArena,
    context_store: &mut FunctionComponentContextRenderStore,
    begin_work: ContextProviderUseContextOpenScopeBeginWorkRecord,
) -> Result<ContextProviderStackRestorationRecord, ContextProviderStackRestorationError> {
    restore_context_provider_stack_for_test(
        arena,
        context_store,
        begin_work,
        ContextProviderStackRestorationPhase::Unwind,
        false,
    )
}

fn restore_context_provider_stack_for_test(
    arena: &mut FiberArena,
    context_store: &mut FunctionComponentContextRenderStore,
    begin_work: ContextProviderUseContextOpenScopeBeginWorkRecord,
    phase: ContextProviderStackRestorationPhase,
    bubble_provider: bool,
) -> Result<ContextProviderStackRestorationRecord, ContextProviderStackRestorationError> {
    expect_context_provider(arena, begin_work.provider())?;
    let stack_depth_before_restore = context_store.stack_depth();
    context_store
        .restore_snapshot(begin_work.provider_snapshot())
        .map_err(
            |error| ContextProviderStackRestorationError::ContextRestore {
                provider: begin_work.provider(),
                context: begin_work.context(),
                snapshot: begin_work.provider_snapshot(),
                error: Box::new(error),
            },
        )?;
    let restored_stack_depth = context_store.stack_depth();

    if bubble_provider {
        let bubbled = bubble_properties(arena, begin_work.provider())?;
        let provider = arena.get_mut(begin_work.provider())?;
        provider.set_child_lanes(bubbled.child_lanes());
        provider.set_subtree_flags(bubbled.subtree_flags());
    }

    let provider = arena.get(begin_work.provider())?;
    Ok(ContextProviderStackRestorationRecord {
        provider: begin_work.provider(),
        context: begin_work.context(),
        value: begin_work.value(),
        provider_snapshot: begin_work.provider_snapshot(),
        phase,
        stack_depth_before_restore,
        restored_stack_depth,
        child_lanes: provider.child_lanes(),
        subtree_flags: provider.subtree_flags(),
    })
}

fn expect_context_provider(
    arena: &FiberArena,
    fiber: FiberId,
) -> Result<(), ContextProviderStackRestorationError> {
    let tag = arena.get(fiber)?.tag();
    if tag == FiberTag::ContextProvider {
        Ok(())
    } else {
        Err(ContextProviderStackRestorationError::UnexpectedFiberTag { fiber, tag })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::begin_work::{
        ContextProviderBeginWorkRequest,
        begin_work_context_provider_use_context_child_for_complete_traversal,
    };
    use crate::function_component::{
        FunctionComponentContextConsumerInvoker, FunctionComponentContextRenderReader,
        FunctionComponentInvocationError, FunctionComponentInvocationRequest,
        FunctionComponentOutputHandle, FunctionComponentRenderError,
    };
    use fast_react_core::{FiberMode, FiberTypeHandle, PropsHandle};

    fn context_value(raw: u64) -> ContextValueHandle {
        ContextValueHandle::from_raw(raw)
    }

    #[derive(Debug)]
    struct TestUseContextInvoker {
        component: FiberTypeHandle,
        context: ContextHandle,
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
}
