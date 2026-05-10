//! Renderer-agnostic context value stack primitives.
//!
//! React's reconciler stores provider values on a LIFO cursor stack while a
//! subtree renders. This module keeps the same core invariant, but stores only
//! typed opaque handles. JavaScript values, renderer objects, and public React
//! context objects belong to higher layers.

use std::error::Error;
use std::fmt::{self, Display, Formatter};
use std::sync::atomic::{AtomicU64, Ordering};

static NEXT_CONTEXT_STACK_ID: AtomicU64 = AtomicU64::new(1);

macro_rules! opaque_context_handle {
    ($name:ident) => {
        #[repr(transparent)]
        #[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
        pub struct $name(u64);

        impl $name {
            pub const NONE: Self = Self(0);

            #[must_use]
            pub const fn from_raw(raw: u64) -> Self {
                Self(raw)
            }

            #[must_use]
            pub const fn raw(self) -> u64 {
                self.0
            }

            #[must_use]
            pub const fn is_none(self) -> bool {
                self.0 == 0
            }

            #[must_use]
            pub const fn is_some(self) -> bool {
                self.0 != 0
            }
        }
    };
}

opaque_context_handle!(ContextHandle);
opaque_context_handle!(ContextValueHandle);
opaque_context_handle!(ContextFrameId);

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct ContextStackId(u64);

impl ContextStackId {
    #[must_use]
    fn allocate() -> Self {
        let raw = NEXT_CONTEXT_STACK_ID.fetch_add(1, Ordering::Relaxed);
        assert_ne!(raw, 0, "context stack id counter wrapped");
        Self(raw)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ContextSlot {
    context: ContextHandle,
    default_value: ContextValueHandle,
    current_value: ContextValueHandle,
    active_provider_count: usize,
}

impl ContextSlot {
    #[must_use]
    pub const fn new(context: ContextHandle, default_value: ContextValueHandle) -> Self {
        Self {
            context,
            default_value,
            current_value: default_value,
            active_provider_count: 0,
        }
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub const fn default_value(self) -> ContextValueHandle {
        self.default_value
    }

    #[must_use]
    pub const fn current_value(self) -> ContextValueHandle {
        self.current_value
    }

    #[must_use]
    pub const fn active_provider_count(self) -> usize {
        self.active_provider_count
    }

    #[must_use]
    pub const fn has_active_provider(self) -> bool {
        self.active_provider_count != 0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ContextStackSnapshot {
    stack_id: ContextStackId,
    depth: usize,
    top_frame: ContextFrameId,
}

impl ContextStackSnapshot {
    #[must_use]
    pub const fn depth(self) -> usize {
        self.depth
    }

    #[must_use]
    pub const fn top_frame(self) -> ContextFrameId {
        self.top_frame
    }

    #[must_use]
    pub const fn is_root(self) -> bool {
        self.depth == 0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ContextStackError {
    UnknownContext {
        context: ContextHandle,
    },
    SnapshotStackMismatch,
    SnapshotDepthAhead {
        snapshot_depth: usize,
        current_depth: usize,
    },
    SnapshotFrameMismatch {
        snapshot_depth: usize,
        expected_top_frame: ContextFrameId,
        actual_top_frame: ContextFrameId,
    },
}

impl Display for ContextStackError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnknownContext { context } => {
                write!(formatter, "unknown context handle {}", context.raw())
            }
            Self::SnapshotStackMismatch => {
                formatter.write_str("context stack snapshot belongs to a different context stack")
            }
            Self::SnapshotDepthAhead {
                snapshot_depth,
                current_depth,
            } => write!(
                formatter,
                "context stack snapshot depth {snapshot_depth} is deeper than current depth {current_depth}"
            ),
            Self::SnapshotFrameMismatch {
                snapshot_depth,
                expected_top_frame,
                actual_top_frame,
            } => write!(
                formatter,
                "context stack snapshot at depth {snapshot_depth} expected top frame {}, found {}",
                expected_top_frame.raw(),
                actual_top_frame.raw()
            ),
        }
    }
}

impl Error for ContextStackError {}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct ContextProviderFrame {
    id: ContextFrameId,
    context: ContextHandle,
    previous_value: ContextValueHandle,
    previous_provider_count: usize,
}

#[derive(Debug)]
pub struct ContextStack {
    stack_id: ContextStackId,
    slots: Vec<ContextSlot>,
    frames: Vec<ContextProviderFrame>,
    next_frame_id: u64,
}

impl ContextStack {
    #[must_use]
    pub fn new() -> Self {
        Self {
            stack_id: ContextStackId::allocate(),
            slots: Vec::new(),
            frames: Vec::new(),
            next_frame_id: 1,
        }
    }

    pub fn create_context(&mut self, default_value: ContextValueHandle) -> ContextHandle {
        let raw = u64::try_from(self.slots.len())
            .expect("context slot count does not fit in u64")
            .checked_add(1)
            .expect("context handle counter wrapped");
        let context = ContextHandle::from_raw(raw);
        self.slots.push(ContextSlot::new(context, default_value));
        context
    }

    #[must_use]
    pub fn context_count(&self) -> usize {
        self.slots.len()
    }

    #[must_use]
    pub fn stack_depth(&self) -> usize {
        self.frames.len()
    }

    #[must_use]
    pub fn snapshot(&self) -> ContextStackSnapshot {
        ContextStackSnapshot {
            stack_id: self.stack_id,
            depth: self.frames.len(),
            top_frame: self
                .frames
                .last()
                .map_or(ContextFrameId::NONE, |frame| frame.id),
        }
    }

    pub fn context_slot(&self, context: ContextHandle) -> Result<ContextSlot, ContextStackError> {
        let index = self.slot_index(context)?;
        Ok(self.slots[index])
    }

    pub fn default_value(
        &self,
        context: ContextHandle,
    ) -> Result<ContextValueHandle, ContextStackError> {
        Ok(self.context_slot(context)?.default_value())
    }

    pub fn current_value(
        &self,
        context: ContextHandle,
    ) -> Result<ContextValueHandle, ContextStackError> {
        Ok(self.context_slot(context)?.current_value())
    }

    pub fn context_slots(&self) -> impl ExactSizeIterator<Item = ContextSlot> + '_ {
        self.slots.iter().copied()
    }

    pub fn push_provider(
        &mut self,
        context: ContextHandle,
        value: ContextValueHandle,
    ) -> Result<ContextStackSnapshot, ContextStackError> {
        let index = self.slot_index(context)?;
        let snapshot = self.snapshot();
        let frame_id = self.allocate_frame_id();
        let slot = &mut self.slots[index];
        let frame = ContextProviderFrame {
            id: frame_id,
            context,
            previous_value: slot.current_value,
            previous_provider_count: slot.active_provider_count,
        };

        slot.current_value = value;
        slot.active_provider_count += 1;
        self.frames.push(frame);

        Ok(snapshot)
    }

    pub fn restore_snapshot(
        &mut self,
        snapshot: ContextStackSnapshot,
    ) -> Result<(), ContextStackError> {
        self.validate_snapshot(snapshot)?;

        while self.frames.len() > snapshot.depth {
            let frame = self
                .frames
                .pop()
                .expect("validated context stack depth must contain a frame");
            let index = self.slot_index(frame.context)?;
            let slot = &mut self.slots[index];

            slot.current_value = frame.previous_value;
            slot.active_provider_count = frame.previous_provider_count;
        }

        Ok(())
    }

    fn validate_snapshot(&self, snapshot: ContextStackSnapshot) -> Result<(), ContextStackError> {
        if snapshot.stack_id != self.stack_id {
            return Err(ContextStackError::SnapshotStackMismatch);
        }

        let current_depth = self.frames.len();
        if snapshot.depth > current_depth {
            return Err(ContextStackError::SnapshotDepthAhead {
                snapshot_depth: snapshot.depth,
                current_depth,
            });
        }

        if snapshot.depth == 0 {
            return Ok(());
        }

        let actual_top_frame = self.frames[snapshot.depth - 1].id;
        if actual_top_frame == snapshot.top_frame {
            Ok(())
        } else {
            Err(ContextStackError::SnapshotFrameMismatch {
                snapshot_depth: snapshot.depth,
                expected_top_frame: snapshot.top_frame,
                actual_top_frame,
            })
        }
    }

    fn slot_index(&self, context: ContextHandle) -> Result<usize, ContextStackError> {
        let Some(raw_index) = context.raw().checked_sub(1) else {
            return Err(ContextStackError::UnknownContext { context });
        };
        let Ok(index) = usize::try_from(raw_index) else {
            return Err(ContextStackError::UnknownContext { context });
        };
        let Some(slot) = self.slots.get(index) else {
            return Err(ContextStackError::UnknownContext { context });
        };

        if slot.context == context {
            Ok(index)
        } else {
            Err(ContextStackError::UnknownContext { context })
        }
    }

    fn allocate_frame_id(&mut self) -> ContextFrameId {
        let frame_id = ContextFrameId::from_raw(self.next_frame_id);
        self.next_frame_id = self
            .next_frame_id
            .checked_add(1)
            .expect("context frame id counter wrapped");
        frame_id
    }
}

impl Default for ContextStack {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn value(raw: u64) -> ContextValueHandle {
        ContextValueHandle::from_raw(raw)
    }

    #[test]
    fn context_stack_default_lookup_preserves_registered_default() {
        let mut stack = ContextStack::new();
        let context = stack.create_context(value(10));

        let slot = stack.context_slot(context).unwrap();

        assert_eq!(slot.context(), context);
        assert_eq!(slot.default_value(), value(10));
        assert_eq!(slot.current_value(), value(10));
        assert_eq!(stack.default_value(context).unwrap(), value(10));
        assert_eq!(stack.current_value(context).unwrap(), value(10));
        assert_eq!(stack.context_count(), 1);
        assert_eq!(stack.stack_depth(), 0);
        assert!(!slot.has_active_provider());
        assert!(stack.snapshot().is_root());
    }

    #[test]
    fn context_stack_nested_providers_restore_previous_values() {
        let mut stack = ContextStack::new();
        let context = stack.create_context(value(1));

        let before_outer = stack.push_provider(context, value(2)).unwrap();
        assert!(before_outer.is_root());
        assert_eq!(stack.current_value(context).unwrap(), value(2));
        assert_eq!(
            stack.context_slot(context).unwrap().active_provider_count(),
            1
        );

        let before_inner = stack.push_provider(context, value(3)).unwrap();
        assert_eq!(before_inner.depth(), 1);
        assert_eq!(stack.current_value(context).unwrap(), value(3));
        assert_eq!(
            stack.context_slot(context).unwrap().active_provider_count(),
            2
        );

        stack.restore_snapshot(before_inner).unwrap();
        assert_eq!(stack.current_value(context).unwrap(), value(2));
        assert_eq!(
            stack.context_slot(context).unwrap().active_provider_count(),
            1
        );

        stack.restore_snapshot(before_outer).unwrap();
        assert_eq!(stack.current_value(context).unwrap(), value(1));
        assert_eq!(
            stack.context_slot(context).unwrap().active_provider_count(),
            0
        );
    }

    #[test]
    fn context_stack_sibling_restore_reuses_parent_snapshot() {
        let mut stack = ContextStack::new();
        let context = stack.create_context(value(100));
        let sibling_parent = stack.snapshot();

        stack.push_provider(context, value(200)).unwrap();
        assert_eq!(stack.current_value(context).unwrap(), value(200));
        stack.restore_snapshot(sibling_parent).unwrap();
        assert_eq!(stack.current_value(context).unwrap(), value(100));

        stack.push_provider(context, value(300)).unwrap();
        assert_eq!(stack.current_value(context).unwrap(), value(300));
        stack.restore_snapshot(sibling_parent).unwrap();

        assert_eq!(stack.current_value(context).unwrap(), value(100));
        assert_eq!(stack.stack_depth(), 0);
    }

    #[test]
    fn context_stack_mismatched_restore_rejects_stale_branch_snapshot() {
        let mut stack = ContextStack::new();
        let first = stack.create_context(value(1));
        let second = stack.create_context(value(2));

        let before_first = stack.push_provider(first, value(11)).unwrap();
        let first_branch = stack.snapshot();
        stack.restore_snapshot(before_first).unwrap();

        stack.push_provider(second, value(22)).unwrap();
        let second_branch = stack.snapshot();
        let error = stack.restore_snapshot(first_branch).unwrap_err();

        assert_eq!(
            error,
            ContextStackError::SnapshotFrameMismatch {
                snapshot_depth: 1,
                expected_top_frame: first_branch.top_frame(),
                actual_top_frame: second_branch.top_frame(),
            }
        );
        assert_eq!(stack.current_value(first).unwrap(), value(1));
        assert_eq!(stack.current_value(second).unwrap(), value(22));
        assert_eq!(stack.stack_depth(), 1);
    }

    #[test]
    fn context_stack_rejects_snapshots_from_other_stacks() {
        let mut first_stack = ContextStack::new();
        let first_context = first_stack.create_context(value(1));
        first_stack.push_provider(first_context, value(2)).unwrap();
        let first_snapshot = first_stack.snapshot();

        let mut second_stack = ContextStack::new();
        let second_context = second_stack.create_context(value(10));
        second_stack
            .push_provider(second_context, value(20))
            .unwrap();

        assert_eq!(
            second_stack.restore_snapshot(first_snapshot),
            Err(ContextStackError::SnapshotStackMismatch)
        );
        assert_eq!(
            second_stack.current_value(second_context).unwrap(),
            value(20)
        );
    }

    #[test]
    fn context_stack_handles_preserve_stable_typed_identity() {
        let mut stack = ContextStack::new();
        let first = stack.create_context(value(7));
        let second = stack.create_context(value(7));

        assert_ne!(first, second);
        assert_eq!(ContextHandle::from_raw(first.raw()), first);
        assert_eq!(ContextHandle::from_raw(second.raw()), second);
        assert_eq!(stack.context_slot(first).unwrap().context(), first);
        assert_eq!(stack.context_slot(second).unwrap().context(), second);

        let before_first = stack.push_provider(first, value(8)).unwrap();

        assert_eq!(stack.current_value(first).unwrap(), value(8));
        assert_eq!(stack.current_value(second).unwrap(), value(7));
        assert_eq!(stack.context_slot(first).unwrap().context(), first);

        stack.restore_snapshot(before_first).unwrap();

        assert_eq!(stack.current_value(first).unwrap(), value(7));
        assert_eq!(stack.current_value(second).unwrap(), value(7));
    }
}
