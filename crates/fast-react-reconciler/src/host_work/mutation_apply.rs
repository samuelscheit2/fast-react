use fast_react_core::FiberId;

use crate::FiberRootId;
use crate::root_commit::HostRootMutationApplyRecord;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestHostRootMutationHostCall {
    AppendChild,
    AppendChildToContainer,
    InsertBefore,
    InsertInContainerBefore,
    RemoveChild,
    RemoveChildFromContainer,
    CommitUpdate,
    CommitTextUpdate,
    ResetTextContent,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestHostRootPrivateStoreMutation {
    HostComponentPropertyAndLatestProps,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TestHostRootMutationApplyStatus {
    Applied(TestHostRootMutationHostCall),
    PrivateHostStoreOnly(TestHostRootPrivateStoreMutation),
    RecordedOnly,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct TestHostRootMutationApplyRecord {
    pub(super) mutation: HostRootMutationApplyRecord,
    pub(super) status: TestHostRootMutationApplyStatus,
}

impl TestHostRootMutationApplyRecord {
    #[must_use]
    pub(crate) const fn mutation(self) -> HostRootMutationApplyRecord {
        self.mutation
    }

    #[must_use]
    pub(crate) const fn status(self) -> TestHostRootMutationApplyStatus {
        self.status
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TestHostRootMutationApplyResult {
    pub(super) root: FiberRootId,
    pub(super) finished_work: FiberId,
    pub(super) records: Vec<TestHostRootMutationApplyRecord>,
}

impl TestHostRootMutationApplyResult {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(&self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) fn records(&self) -> &[TestHostRootMutationApplyRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn applied_host_call_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| matches!(record.status(), TestHostRootMutationApplyStatus::Applied(_)))
            .count()
    }

    #[must_use]
    pub(crate) fn private_host_store_update_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                matches!(
                    record.status(),
                    TestHostRootMutationApplyStatus::PrivateHostStoreOnly(_)
                )
            })
            .count()
    }

    #[must_use]
    pub(super) fn recorded_only_count(&self) -> usize {
        self.records
            .iter()
            .filter(|record| {
                matches!(
                    record.status(),
                    TestHostRootMutationApplyStatus::RecordedOnly
                )
            })
            .count()
    }
}
