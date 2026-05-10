//! Reconciler execution-context guards.
//!
//! React keeps a process-global execution-context bitset so flush APIs can
//! reject render/commit reentry before entering the root scheduler. This Rust
//! foundation keeps the state explicit and caller-owned, which makes tests and
//! later renderer facades deterministic without introducing global mutable
//! state.

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ExecutionContext(u8);

impl ExecutionContext {
    pub const NO: Self = Self(0b000);
    pub const BATCHED: Self = Self(0b001);
    pub const RENDER: Self = Self(0b010);
    pub const COMMIT: Self = Self(0b100);
    pub const RENDER_OR_COMMIT: Self = Self(Self::RENDER.bits() | Self::COMMIT.bits());

    const VALID_BITS: u8 = Self::BATCHED.bits() | Self::RENDER.bits() | Self::COMMIT.bits();

    #[must_use]
    pub const fn from_bits(bits: u8) -> Option<Self> {
        if bits & !Self::VALID_BITS == 0 {
            Some(Self(bits))
        } else {
            None
        }
    }

    #[must_use]
    pub const fn bits(self) -> u8 {
        self.0
    }

    #[must_use]
    pub const fn is_empty(self) -> bool {
        self.0 == Self::NO.0
    }

    #[must_use]
    pub const fn contains(self, context: Self) -> bool {
        self.0 & context.0 == context.0
    }

    #[must_use]
    pub const fn intersects(self, context: Self) -> bool {
        self.0 & context.0 != Self::NO.0
    }

    #[must_use]
    pub const fn with(self, context: Self) -> Self {
        Self(self.0 | context.0)
    }

    #[must_use]
    pub const fn without(self, context: Self) -> Self {
        Self(self.0 & !context.0)
    }

    #[must_use]
    pub const fn is_render_or_commit(self) -> bool {
        self.intersects(Self::RENDER_OR_COMMIT)
    }
}

impl Default for ExecutionContext {
    fn default() -> Self {
        Self::NO
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SyncFlushExecutionContextRecord {
    current: ExecutionContext,
    blocked_by_render_or_commit: bool,
}

impl SyncFlushExecutionContextRecord {
    #[must_use]
    pub const fn current(self) -> ExecutionContext {
        self.current
    }

    #[must_use]
    pub const fn blocked_by_render_or_commit(self) -> bool {
        self.blocked_by_render_or_commit
    }

    #[must_use]
    pub const fn can_enter_sync_flush(self) -> bool {
        !self.blocked_by_render_or_commit
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ExecutionContextState {
    current: ExecutionContext,
}

impl ExecutionContextState {
    #[must_use]
    pub const fn new() -> Self {
        Self {
            current: ExecutionContext::NO,
        }
    }

    #[must_use]
    pub const fn current(self) -> ExecutionContext {
        self.current
    }

    #[must_use]
    pub const fn is_already_rendering_or_committing(self) -> bool {
        self.current.is_render_or_commit()
    }

    #[must_use]
    pub const fn sync_flush_record(self) -> SyncFlushExecutionContextRecord {
        SyncFlushExecutionContextRecord {
            current: self.current,
            blocked_by_render_or_commit: self.is_already_rendering_or_committing(),
        }
    }

    pub fn with_context<R>(
        &mut self,
        context: ExecutionContext,
        run: impl FnOnce(&mut Self) -> R,
    ) -> R {
        let previous = self.current;
        self.current = self.current.with(context);
        let mut reset = ExecutionContextReset {
            state: self,
            previous,
        };
        run(reset.state())
    }

    pub fn with_batched_context<R>(&mut self, run: impl FnOnce(&mut Self) -> R) -> R {
        self.with_context(ExecutionContext::BATCHED, run)
    }

    pub fn with_render_context<R>(&mut self, run: impl FnOnce(&mut Self) -> R) -> R {
        self.with_context(ExecutionContext::RENDER, run)
    }

    pub fn with_commit_context<R>(&mut self, run: impl FnOnce(&mut Self) -> R) -> R {
        self.with_context(ExecutionContext::COMMIT, run)
    }
}

impl Default for ExecutionContextState {
    fn default() -> Self {
        Self::new()
    }
}

struct ExecutionContextReset<'a> {
    state: &'a mut ExecutionContextState,
    previous: ExecutionContext,
}

impl ExecutionContextReset<'_> {
    fn state(&mut self) -> &mut ExecutionContextState {
        self.state
    }
}

impl Drop for ExecutionContextReset<'_> {
    fn drop(&mut self) {
        self.state.current = self.previous;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::panic::{AssertUnwindSafe, catch_unwind};

    #[test]
    fn execution_context_flags_match_react_guard_bits() {
        assert_eq!(ExecutionContext::NO.bits(), 0b000);
        assert_eq!(ExecutionContext::BATCHED.bits(), 0b001);
        assert_eq!(ExecutionContext::RENDER.bits(), 0b010);
        assert_eq!(ExecutionContext::COMMIT.bits(), 0b100);
        assert_eq!(
            ExecutionContext::RENDER_OR_COMMIT.bits(),
            ExecutionContext::RENDER.bits() | ExecutionContext::COMMIT.bits()
        );
        assert!(ExecutionContext::from_bits(0b111).is_some());
        assert_eq!(ExecutionContext::from_bits(0b1000), None);
    }

    #[test]
    fn execution_context_nested_scopes_restore_previous_state() {
        let mut state = ExecutionContextState::new();

        state.with_batched_context(|state| {
            assert_eq!(state.current(), ExecutionContext::BATCHED);
            state.with_render_context(|state| {
                assert!(state.current().contains(ExecutionContext::BATCHED));
                assert!(state.current().contains(ExecutionContext::RENDER));
                assert!(state.is_already_rendering_or_committing());
            });
            assert_eq!(state.current(), ExecutionContext::BATCHED);
        });

        assert_eq!(state.current(), ExecutionContext::NO);
    }

    #[test]
    fn execution_context_scope_restores_when_panicking() {
        let mut state = ExecutionContextState::new();

        let result = catch_unwind(AssertUnwindSafe(|| {
            state.with_commit_context(|state| {
                assert!(state.is_already_rendering_or_committing());
                panic!("force execution-context reset");
            });
        }));

        assert!(result.is_err());
        assert_eq!(state.current(), ExecutionContext::NO);
    }

    #[test]
    fn execution_context_sync_flush_record_rejects_render_and_commit() {
        let state = ExecutionContextState::new();
        assert!(state.sync_flush_record().can_enter_sync_flush());

        let mut state = ExecutionContextState::new();
        state.with_render_context(|state| {
            let record = state.sync_flush_record();
            assert_eq!(record.current(), ExecutionContext::RENDER);
            assert!(record.blocked_by_render_or_commit());
            assert!(!record.can_enter_sync_flush());
        });

        state.with_commit_context(|state| {
            let record = state.sync_flush_record();
            assert_eq!(record.current(), ExecutionContext::COMMIT);
            assert!(record.blocked_by_render_or_commit());
        });
    }
}
