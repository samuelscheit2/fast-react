//! Phase-scoped reconciler host token metadata.
//!
//! Tokens created here are reconciler-owned IDs for future host creation,
//! commit, hydration, and deletion calls. Future ref attach/detach work should
//! validate instance tokens against those same commit/deletion phase records
//! before public-instance lookup exists. The metadata records root/fiber
//! ownership plus phase and target; it never exposes raw fibers or DOM nodes.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::FiberId;
use fast_react_host_config::{HostFiberTokenPhase, HostFiberTokenTarget, HostFiberTokenViolation};

use crate::FiberRootId;

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct HostFiberTokenId(u64);

impl HostFiberTokenId {
    pub const NONE: Self = Self(0);

    #[must_use]
    pub const fn new(raw: u64) -> Option<Self> {
        if raw == 0 { None } else { Some(Self(raw)) }
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

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct HostFiberTokenGeneration(u64);

impl HostFiberTokenGeneration {
    pub const INITIAL: Self = Self(0);

    #[must_use]
    pub const fn raw(self) -> u64 {
        self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostFiberTokenRecord {
    root_id: FiberRootId,
    fiber_id: FiberId,
    phase: HostFiberTokenPhase,
    target: HostFiberTokenTarget,
    generation: HostFiberTokenGeneration,
    active: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostFiberTokenMetadata {
    root_id: FiberRootId,
    phase: HostFiberTokenPhase,
    target: HostFiberTokenTarget,
    generation: HostFiberTokenGeneration,
    active: bool,
}

impl HostFiberTokenMetadata {
    #[must_use]
    pub const fn root_id(self) -> FiberRootId {
        self.root_id
    }

    #[must_use]
    pub const fn phase(self) -> HostFiberTokenPhase {
        self.phase
    }

    #[must_use]
    pub const fn target(self) -> HostFiberTokenTarget {
        self.target
    }

    #[must_use]
    pub const fn generation(self) -> HostFiberTokenGeneration {
        self.generation
    }

    #[must_use]
    pub const fn is_active(self) -> bool {
        self.active
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HostFiberTokenValidationError {
    token: HostFiberTokenId,
    phase: HostFiberTokenPhase,
    target: HostFiberTokenTarget,
    violation: HostFiberTokenViolation,
}

impl HostFiberTokenValidationError {
    #[must_use]
    pub const fn new(
        token: HostFiberTokenId,
        phase: HostFiberTokenPhase,
        target: HostFiberTokenTarget,
        violation: HostFiberTokenViolation,
    ) -> Self {
        Self {
            token,
            phase,
            target,
            violation,
        }
    }

    #[must_use]
    pub const fn token(&self) -> HostFiberTokenId {
        self.token
    }

    #[must_use]
    pub const fn phase(&self) -> HostFiberTokenPhase {
        self.phase
    }

    #[must_use]
    pub const fn target(&self) -> HostFiberTokenTarget {
        self.target
    }

    #[must_use]
    pub const fn violation(&self) -> HostFiberTokenViolation {
        self.violation
    }
}

impl Display for HostFiberTokenValidationError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        write!(
            formatter,
            "{} {} host fiber token {} is invalid: {}",
            self.phase,
            self.target,
            self.token.raw(),
            self.violation
        )
    }
}

impl Error for HostFiberTokenValidationError {}

#[derive(Debug, Default, Clone)]
pub struct HostFiberTokenStore {
    records: Vec<Option<HostFiberTokenRecord>>,
}

impl HostFiberTokenStore {
    #[must_use]
    pub const fn new() -> Self {
        Self {
            records: Vec::new(),
        }
    }

    pub fn issue(
        &mut self,
        root_id: FiberRootId,
        fiber_id: FiberId,
        phase: HostFiberTokenPhase,
        target: HostFiberTokenTarget,
    ) -> HostFiberTokenId {
        let token = HostFiberTokenId(self.records.len() as u64 + 1);
        self.records.push(Some(HostFiberTokenRecord {
            root_id,
            fiber_id,
            phase,
            target,
            generation: HostFiberTokenGeneration::INITIAL,
            active: true,
        }));
        token
    }

    pub fn validate(
        &self,
        token: HostFiberTokenId,
        root_id: FiberRootId,
        fiber_id: FiberId,
        phase: HostFiberTokenPhase,
        target: HostFiberTokenTarget,
    ) -> Result<(), HostFiberTokenValidationError> {
        let Some(record) = self.record(token, phase, target)? else {
            return Err(HostFiberTokenValidationError::new(
                token,
                phase,
                target,
                HostFiberTokenViolation::Invalid,
            ));
        };

        if !record.active {
            return Err(HostFiberTokenValidationError::new(
                token,
                phase,
                target,
                HostFiberTokenViolation::Stale,
            ));
        }
        if record.root_id != root_id {
            return Err(HostFiberTokenValidationError::new(
                token,
                phase,
                target,
                HostFiberTokenViolation::WrongRenderer,
            ));
        }
        if record.fiber_id != fiber_id {
            return Err(HostFiberTokenValidationError::new(
                token,
                phase,
                target,
                HostFiberTokenViolation::Invalid,
            ));
        }
        Self::validate_record_scope(token, phase, target, record.phase, record.target)?;

        Ok(())
    }

    pub fn metadata(
        &self,
        token: HostFiberTokenId,
        phase: HostFiberTokenPhase,
        target: HostFiberTokenTarget,
    ) -> Result<HostFiberTokenMetadata, HostFiberTokenValidationError> {
        let Some(record) = self.record(token, phase, target)? else {
            return Err(HostFiberTokenValidationError::new(
                token,
                phase,
                target,
                HostFiberTokenViolation::Invalid,
            ));
        };
        Self::validate_record_scope(token, phase, target, record.phase, record.target)?;

        Ok(HostFiberTokenMetadata {
            root_id: record.root_id,
            phase: record.phase,
            target: record.target,
            generation: record.generation,
            active: record.active,
        })
    }

    pub fn invalidate(
        &mut self,
        token: HostFiberTokenId,
        phase: HostFiberTokenPhase,
        target: HostFiberTokenTarget,
    ) -> Result<(), HostFiberTokenValidationError> {
        let Some(record) = self.record_mut(token, phase, target)? else {
            return Err(HostFiberTokenValidationError::new(
                token,
                phase,
                target,
                HostFiberTokenViolation::Invalid,
            ));
        };
        Self::validate_record_scope(token, phase, target, record.phase, record.target)?;
        record.active = false;
        Ok(())
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.records.iter().flatten().count()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    fn record(
        &self,
        token: HostFiberTokenId,
        phase: HostFiberTokenPhase,
        target: HostFiberTokenTarget,
    ) -> Result<Option<&HostFiberTokenRecord>, HostFiberTokenValidationError> {
        if token.is_none() {
            return Err(HostFiberTokenValidationError::new(
                token,
                phase,
                target,
                HostFiberTokenViolation::Invalid,
            ));
        }

        Ok(self
            .records
            .get((token.raw() - 1) as usize)
            .and_then(Option::as_ref))
    }

    fn record_mut(
        &mut self,
        token: HostFiberTokenId,
        phase: HostFiberTokenPhase,
        target: HostFiberTokenTarget,
    ) -> Result<Option<&mut HostFiberTokenRecord>, HostFiberTokenValidationError> {
        if token.is_none() {
            return Err(HostFiberTokenValidationError::new(
                token,
                phase,
                target,
                HostFiberTokenViolation::Invalid,
            ));
        }

        Ok(self
            .records
            .get_mut((token.raw() - 1) as usize)
            .and_then(Option::as_mut))
    }

    fn validate_record_scope(
        token: HostFiberTokenId,
        phase: HostFiberTokenPhase,
        target: HostFiberTokenTarget,
        record_phase: HostFiberTokenPhase,
        record_target: HostFiberTokenTarget,
    ) -> Result<(), HostFiberTokenValidationError> {
        if record_phase != phase {
            return Err(HostFiberTokenValidationError::new(
                token,
                phase,
                target,
                HostFiberTokenViolation::WrongPhase,
            ));
        }
        if record_target != target {
            return Err(HostFiberTokenValidationError::new(
                token,
                phase,
                target,
                HostFiberTokenViolation::WrongTarget,
            ));
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use fast_react_core::{FiberArena, FiberMode, FiberTag, PropsHandle};

    fn root_id() -> FiberRootId {
        FiberRootId::new(1).unwrap()
    }

    fn create_fiber_id() -> FiberId {
        let mut arena = FiberArena::new();
        arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        )
    }

    fn assert_violation<T: std::fmt::Debug>(
        result: Result<T, HostFiberTokenValidationError>,
        violation: HostFiberTokenViolation,
    ) {
        assert_eq!(result.unwrap_err().violation(), violation);
    }

    #[test]
    fn host_tokens_issue_phase_scoped_metadata_without_exposing_host_nodes() {
        let root_id = root_id();
        let fiber_id = create_fiber_id();
        let mut store = HostFiberTokenStore::new();

        let token = store.issue(
            root_id,
            fiber_id,
            HostFiberTokenPhase::Creation,
            HostFiberTokenTarget::Instance,
        );

        assert_eq!(store.len(), 1);
        assert!(!store.is_empty());

        let metadata = store
            .metadata(
                token,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::Instance,
            )
            .unwrap();
        assert_eq!(metadata.root_id(), root_id);
        assert_eq!(metadata.phase(), HostFiberTokenPhase::Creation);
        assert_eq!(metadata.target(), HostFiberTokenTarget::Instance);
        assert_eq!(metadata.generation(), HostFiberTokenGeneration::INITIAL);
        assert!(metadata.is_active());
    }

    #[test]
    fn host_tokens_accept_commit_deletion_and_reserved_ref_lifecycle_tokens() {
        let root_id = root_id();
        let ref_attach_fiber = create_fiber_id();
        let ref_detach_fiber = create_fiber_id();
        let text_deletion_fiber = create_fiber_id();
        let mut store = HostFiberTokenStore::new();
        let ref_attach_token = store.issue(
            root_id,
            ref_attach_fiber,
            HostFiberTokenPhase::Commit,
            HostFiberTokenTarget::Instance,
        );
        let ref_detach_token = store.issue(
            root_id,
            ref_detach_fiber,
            HostFiberTokenPhase::Deletion,
            HostFiberTokenTarget::Instance,
        );
        let text_deletion_token = store.issue(
            root_id,
            text_deletion_fiber,
            HostFiberTokenPhase::Deletion,
            HostFiberTokenTarget::TextInstance,
        );

        store
            .validate(
                ref_attach_token,
                root_id,
                ref_attach_fiber,
                HostFiberTokenPhase::Commit,
                HostFiberTokenTarget::Instance,
            )
            .unwrap();
        store
            .validate(
                ref_detach_token,
                root_id,
                ref_detach_fiber,
                HostFiberTokenPhase::Deletion,
                HostFiberTokenTarget::Instance,
            )
            .unwrap();
        store
            .validate(
                text_deletion_token,
                root_id,
                text_deletion_fiber,
                HostFiberTokenPhase::Deletion,
                HostFiberTokenTarget::TextInstance,
            )
            .unwrap();

        let attach_metadata = store
            .metadata(
                ref_attach_token,
                HostFiberTokenPhase::Commit,
                HostFiberTokenTarget::Instance,
            )
            .unwrap();
        assert_eq!(attach_metadata.root_id(), root_id);
        assert_eq!(attach_metadata.phase(), HostFiberTokenPhase::Commit);
        assert_eq!(attach_metadata.target(), HostFiberTokenTarget::Instance);
    }

    #[test]
    fn host_tokens_reject_wrong_phase_without_invalidation() {
        let root_id = root_id();
        let fiber_id = create_fiber_id();
        let mut store = HostFiberTokenStore::new();
        let token = store.issue(
            root_id,
            fiber_id,
            HostFiberTokenPhase::Deletion,
            HostFiberTokenTarget::Instance,
        );

        assert_violation(
            store.validate(
                token,
                root_id,
                fiber_id,
                HostFiberTokenPhase::Commit,
                HostFiberTokenTarget::Instance,
            ),
            HostFiberTokenViolation::WrongPhase,
        );
        assert_violation(
            store.metadata(
                token,
                HostFiberTokenPhase::Commit,
                HostFiberTokenTarget::Instance,
            ),
            HostFiberTokenViolation::WrongPhase,
        );
        assert_violation(
            store.invalidate(
                token,
                HostFiberTokenPhase::Commit,
                HostFiberTokenTarget::Instance,
            ),
            HostFiberTokenViolation::WrongPhase,
        );

        store
            .validate(
                token,
                root_id,
                fiber_id,
                HostFiberTokenPhase::Deletion,
                HostFiberTokenTarget::Instance,
            )
            .unwrap();
    }

    #[test]
    fn host_tokens_reject_wrong_target_without_invalidation() {
        let root_id = root_id();
        let fiber_id = create_fiber_id();
        let mut store = HostFiberTokenStore::new();
        let token = store.issue(
            root_id,
            fiber_id,
            HostFiberTokenPhase::Commit,
            HostFiberTokenTarget::Instance,
        );

        assert_violation(
            store.validate(
                token,
                root_id,
                fiber_id,
                HostFiberTokenPhase::Commit,
                HostFiberTokenTarget::TextInstance,
            ),
            HostFiberTokenViolation::WrongTarget,
        );
        assert_violation(
            store.metadata(
                token,
                HostFiberTokenPhase::Commit,
                HostFiberTokenTarget::TextInstance,
            ),
            HostFiberTokenViolation::WrongTarget,
        );
        assert_violation(
            store.invalidate(
                token,
                HostFiberTokenPhase::Commit,
                HostFiberTokenTarget::TextInstance,
            ),
            HostFiberTokenViolation::WrongTarget,
        );

        store
            .validate(
                token,
                root_id,
                fiber_id,
                HostFiberTokenPhase::Commit,
                HostFiberTokenTarget::Instance,
            )
            .unwrap();
    }

    #[test]
    fn host_tokens_reject_wrong_root_and_fiber_identity() {
        let root_id = root_id();
        let fiber_id = create_fiber_id();
        let other_fiber_id = create_fiber_id();
        let mut store = HostFiberTokenStore::new();
        let token = store.issue(
            root_id,
            fiber_id,
            HostFiberTokenPhase::Commit,
            HostFiberTokenTarget::Instance,
        );

        assert_violation(
            store.validate(
                token,
                FiberRootId::new(2).unwrap(),
                fiber_id,
                HostFiberTokenPhase::Commit,
                HostFiberTokenTarget::Instance,
            ),
            HostFiberTokenViolation::WrongRenderer,
        );
        assert_violation(
            store.validate(
                token,
                root_id,
                other_fiber_id,
                HostFiberTokenPhase::Commit,
                HostFiberTokenTarget::Instance,
            ),
            HostFiberTokenViolation::Invalid,
        );
    }

    #[test]
    fn host_tokens_reject_stale_tokens_after_invalidation() {
        let root_id = root_id();
        let fiber_id = create_fiber_id();
        let mut store = HostFiberTokenStore::new();
        let token = store.issue(
            root_id,
            fiber_id,
            HostFiberTokenPhase::Deletion,
            HostFiberTokenTarget::Instance,
        );

        store
            .invalidate(
                token,
                HostFiberTokenPhase::Deletion,
                HostFiberTokenTarget::Instance,
            )
            .unwrap();
        assert_violation(
            store.validate(
                token,
                root_id,
                fiber_id,
                HostFiberTokenPhase::Deletion,
                HostFiberTokenTarget::Instance,
            ),
            HostFiberTokenViolation::Stale,
        );

        let metadata = store
            .metadata(
                token,
                HostFiberTokenPhase::Deletion,
                HostFiberTokenTarget::Instance,
            )
            .unwrap();
        assert!(!metadata.is_active());
    }

    #[test]
    fn host_tokens_reject_none_and_missing_tokens() {
        let root_id = root_id();
        let fiber_id = create_fiber_id();
        let mut store = HostFiberTokenStore::new();
        let missing = HostFiberTokenId::new(99).unwrap();

        assert_violation(
            store.validate(
                HostFiberTokenId::NONE,
                root_id,
                fiber_id,
                HostFiberTokenPhase::Commit,
                HostFiberTokenTarget::Instance,
            ),
            HostFiberTokenViolation::Invalid,
        );
        assert_violation(
            store.metadata(
                missing,
                HostFiberTokenPhase::Commit,
                HostFiberTokenTarget::Instance,
            ),
            HostFiberTokenViolation::Invalid,
        );
        assert_violation(
            store.invalidate(
                missing,
                HostFiberTokenPhase::Commit,
                HostFiberTokenTarget::Instance,
            ),
            HostFiberTokenViolation::Invalid,
        );
    }
}
